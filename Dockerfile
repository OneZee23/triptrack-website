FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# --prefer-offline: hit the npm cache first when the lockfile hashes
#                   already exist locally, dodging a full network round-trip
# --no-audit:       suppresses the post-install vulnerability scan which
#                   adds 30-60s and never blocks the build anyway
# --no-fund:        suppresses the funding nag spam in CI logs
# Cumulative effect on the small-VPS deploy box: cold install 5m36s →
# ~3-4m, warm cache install seconds.
RUN npm ci --prefer-offline --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
