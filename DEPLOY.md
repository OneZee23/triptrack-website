# Deploy TripTrack Website — trip-track.app

## Текущий production-процесс (2 октября 2026)

Рабочая ветка — `master`. Push запускает `.github/workflows/deploy.yml`:
GitHub runner собирает образ, сохраняет предыдущий running image под
`triptrack-web:rollback-before-<release-sha>`, передаёт новый образ на VPS
через SSH и обновляет только `triptrack-web`. Аналитика и её база не
перезапускаются. Перед заменой образа публичные assets работающей версии
сохраняются в `/opt/triptrack-website/asset-history`. nginx читает этот
каталог через read-only mount при отсутствии старого hashed URL в новом
образе; HTML туда не переносится. Срок хранения — 30 дней от последнего
выпуска, где файл использовался. Первое включение также переносит assets
двух сохранённых предыдущих rollback-образов. Не удалять архив в обычном
деплое: он нужен старым открытым вкладкам. Прямая загрузка слоёв GHCR с VPS ранее зависала, поэтому
не заменять передачу образа на `docker compose pull`.

Проверить результат: GitHub Actions → обе jobs успешны; running image
совпадает с новым image ID; HTTP smoke проверяет главную, роадмап,
JavaScript текущей сборки, сохранённый asset и некешируемый 404 для
несуществующего файла. Затем проверить HTTPS-сайт через браузер
(Cloudflare может отвечать 403 небраузерному HTTP-клиенту), Apple login,
личную карту и отсутствие редактора при закрытом серверном флаге.
Сборка CI не является проверкой Apple-входа.

Создание поездок закрыто `WEB_MANUAL_TRIPS_ENABLED=false` до исправленного
iOS. Порядок совместного выпуска — [docs/STATE.md](docs/STATE.md).
Backend использует свой GitLab pipeline, не этот workflow.

Для отката на VPS используйте сохранённый rollback image с временным
compose override для **одного** сервиса `triptrack-web`; не запускайте
остальной compose-стек. Не удаляйте rollback tag до окончания проверки.
Повтор той же CI-сборки сохраняет первоначальный backup.

Ниже сохранена исходная инструкция создания нового VPS. `deploy.sh`
относится к прежней сборке на сервере и не используется текущим pipeline.
Для существующего production не нужно повторять provisioning или настройку
аналитики. Секреты и адреса серверов не добавлять в репозиторий.


## 1. Create DigitalOcean Droplet

- Ubuntu 24.04, $6/mo (1 vCPU, 1GB RAM)
- Add your Mac's SSH key during creation (`~/.ssh/id_ed25519.pub` or `~/.ssh/id_rsa.pub`)
- Note the droplet IP

## 2. Server Hardening (run as root)

SSH in:

```bash
ssh root@YOUR_IP
```

### Create user `onezee` with sudo:

```bash
adduser --disabled-password --gecos "" onezee
usermod -aG sudo onezee
echo "onezee ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/onezee
chmod 440 /etc/sudoers.d/onezee
```

### Copy SSH key from root to onezee:

```bash
mkdir -p /home/onezee/.ssh
cp /root/.ssh/authorized_keys /home/onezee/.ssh/authorized_keys
chown -R onezee:onezee /home/onezee/.ssh
chmod 700 /home/onezee/.ssh
chmod 600 /home/onezee/.ssh/authorized_keys
```

### ⚠️ Test before locking out! Open a NEW terminal:

```bash
ssh onezee@YOUR_IP
```

If that works, continue. If not — fix before proceeding.

### Disable password auth & root login:

```bash
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd
```

### Firewall (UFW):

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

## 3. Install Docker & Nginx (as onezee)

```bash
ssh onezee@YOUR_IP
```

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker onezee
```

Log out and back in for docker group to take effect:

```bash
exit
ssh onezee@YOUR_IP
docker ps   # should work without sudo
```

Install nginx + certbot:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

## 4. Clone & Start

```bash
sudo git clone https://github.com/YOUR_USERNAME/triptrack-website.git /opt/triptrack-website
sudo chown -R onezee:onezee /opt/triptrack-website
cd /opt/triptrack-website
```

Create `.env`:

```bash
cp .env.example .env
nano .env
```

Set real passwords (generate with `openssl rand -hex 32`).

Start:

```bash
docker compose up -d
```

Check:

```bash
curl http://localhost:3080    # website
curl http://localhost:3001    # umami
```

## 5. Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/triptrack
```

Paste:

```nginx
server {
    server_name trip-track.app www.trip-track.app;

    location / {
        proxy_pass http://127.0.0.1:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /umami/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/triptrack /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 6. DNS (Cloudflare)

Add A record:
- Name: `@`
- Content: `YOUR_DROPLET_IP`
- Proxy: OFF (grey cloud) — until SSL is set up

Add A record for www:
- Name: `www`
- Content: `YOUR_DROPLET_IP`
- Proxy: OFF

## 7. SSL

```bash
sudo certbot --nginx -d trip-track.app -d www.trip-track.app
```

After SSL works, go back to Cloudflare and turn Proxy ON (orange cloud) if you want CDN.

## 8. Umami Analytics Setup

1. Open `https://trip-track.app/umami/`
2. Login: `admin` / `umami` — **change password immediately**
3. Settings → Websites → Add website: `trip-track.app`
4. Copy the Website ID
5. Edit `index.html` in your repo — uncomment the Umami `<script>` tag and paste the Website ID
6. Push to master → GitHub Actions auto-deploys

## 9. GitHub Actions CI/CD

In your GitHub repo → Settings → Secrets and variables → Actions, add:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | Droplet IP address |
| `VPS_USER` | `onezee` |
| `VPS_SSH_KEY` | Contents of `~/.ssh/id_ed25519` (private key) from your Mac |

Now every push to `master` auto-deploys.

## Useful Commands

```bash
# SSH in
ssh onezee@YOUR_IP

# View logs
cd /opt/triptrack-website
docker compose logs -f

# Manual redeploy
cd /opt/triptrack-website
git pull
docker compose build --no-cache triptrack-web
docker compose up -d

# Update Umami
docker compose pull umami
docker compose up -d

# Renew SSL (auto, but manual if needed)
sudo certbot renew
```
