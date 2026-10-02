#!/usr/bin/env bash
# Check the actual nginx response, not just the new Docker image identity.
set -euo pipefail
container=${1:?Website container is required}
history=${2:?Asset history directory is required}
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

ready=false
for attempt in {1..15}; do
  if docker exec "$container" curl -fsS --max-time 2 http://127.0.0.1:8080/ > "$work/page" 2>/dev/null; then
    ready=true
    break
  fi
  sleep 1
done
if [ "$ready" != true ]; then
  echo 'Website did not become ready after restart' >&2; exit 1
fi

for path in / /ru/roadmap; do
  docker exec "$container" curl -fsS --max-time 5 "http://127.0.0.1:8080$path" > "$work/page"
  grep -q '<h1' "$work/page"
  case "$path" in
    /) grep -q 'Your drive diary' "$work/page"; cp "$work/page" "$work/home" ;;
    /ru/roadmap) grep -q '<h1>Куда едем дальше.</h1>' "$work/page" ;;
  esac
done

# Resolve the actual entry from this release's HTML and compare its response
# with the image bytes. A 200 SPA fallback with text/html must fail here.
entry=$(sed -n '/<script type="module"/{s/.*src="\([^"]*\)".*/\1/p;q;}' "$work/home")
case "$entry" in
  /assets/*.js) ;;
  *) echo 'No hashed JavaScript entry in the home page' >&2; exit 1 ;;
esac
docker exec "$container" curl -fsS --max-time 5 -I \
  "http://127.0.0.1:8080$entry" > "$work/headers"
grep -qi 'Content-Type:.*javascript' "$work/headers"
docker exec "$container" curl -fsS --max-time 5 "http://127.0.0.1:8080$entry" > "$work/entry"
docker exec "$container" cat "/usr/share/nginx/html$entry" > "$work/expected-entry"
cmp "$work/entry" "$work/expected-entry"

# Verify retained bytes through nginx (including its history fallback), not
# only that a file was copied. A branded HTML 404 cannot pass this comparison.
docker exec "$container" find /usr/share/nginx/html/assets -type f > "$work/current-assets"
retained=''
while IFS= read -r candidate; do
  retained=$candidate
  path=${candidate#"$history"}
  if ! grep -Fxq "/usr/share/nginx/html$path" "$work/current-assets"; then
    break
  fi
done < <(find "$history/assets" -type f -name '*.js')
if [ -n "$retained" ]; then
  path=${retained#"$history"}
  docker exec "$container" curl -fsS --max-time 5 "http://127.0.0.1:8080$path" > "$work/asset"
  cmp "$retained" "$work/asset"
fi

# A missing hashed asset must never acquire the one-year immutable policy.
docker exec "$container" curl -sS --max-time 5 -D - -o /dev/null \
  http://127.0.0.1:8080/assets/__deploy_probe_missing__.js > "$work/headers"
grep -q 'HTTP/1.1 404' "$work/headers"
grep -qi 'Cache-Control: no-store' "$work/headers"
if grep -qi 'immutable' "$work/headers"; then
  echo 'Missing asset has immutable cache headers' >&2; exit 1
fi
echo 'Website pages, retained JavaScript and asset 404 headers verified'
