#!/usr/bin/env bash
# Run on the VPS BEFORE loading/restarting the next website image.
# Usage: retain-web-assets.sh /absolute/asset-history [running-container-id]
set -euo pipefail
umask 022

history=${1:?Absolute asset history directory is required}
current_container=${2:-}
case "$history" in
  /*) ;;
  *) echo 'Asset history must be an absolute path' >&2; exit 1 ;;
esac
mkdir -p "$history/assets"
chmod 755 "$history" "$history/assets"
stage=$(mktemp -d)
temporary_container=''
cleanup() {
  if [ -n "$temporary_container" ]; then
    timeout 30 docker rm "$temporary_container" >/dev/null 2>&1 || true
  fi
  rm -rf "$stage"
}
trap cleanup EXIT

retain_container() {
  local source_container=$1
  local file relative target
  mkdir -p "$stage/assets"
  timeout 60 docker cp "$source_container:/usr/share/nginx/html/assets/." "$stage/assets/"
  # The archive contains public build files only, never symlinks or HTML.
  if [ -n "$(find "$stage/assets" ! -type f ! -type d -print -quit)" ]; then
    echo 'Unexpected non-regular build asset' >&2; exit 1
  fi
  if [ -z "$(find "$stage/assets" -type f -name '*.js' -print -quit)" ]; then
    echo 'No JavaScript assets to retain' >&2; exit 1
  fi
  while IFS= read -r -d '' file; do
    relative=${file#"$stage/assets/"}
    target="$history/assets/$relative"
    mkdir -p "$(dirname "$target")"
    if [ ! -f "$target" ]; then
      # Atomic publication: an old tab may be reading this directory now.
      cp "$file" "$target.tmp"
      chmod 644 "$target.tmp"
      mv "$target.tmp" "$target"
    fi
    # Retention starts when a release stops being current, not at build time.
    touch "$target"
  done < <(find "$stage/assets" -type f -print0)
  rm -rf "$stage/assets"
}

current_image=''
if [ -n "$current_container" ]; then
  current_image=$(timeout 30 docker inspect --format '{{.Image}}' "$current_container")
fi

# First rollout also repairs tabs from the two earlier retained images.
# Never refresh these old files again on later deploys, or they could never age out.
if [ ! -f "$history/.bootstrapped" ]; then
  timeout 30 docker image ls --no-trunc --filter 'reference=triptrack-web:rollback-before-*' \
    --format '{{.ID}}' > "$stage/images"
  awk -v current="$current_image" '$0 != current && !seen[$0]++ { if (++count <= 2) print }' \
    "$stage/images" > "$stage/bootstrap-images"
  while IFS= read -r image; do
    temporary_container=$(timeout 30 docker create "$image")
    retain_container "$temporary_container"
    timeout 30 docker rm "$temporary_container" >/dev/null
    temporary_container=''
  done < "$stage/bootstrap-images"
fi

# Copy the running version last. Its files stay available even when docker
# image prune removes the old image after this deploy.
if [ -n "$current_container" ]; then
  retain_container "$current_container"
fi

# New timestamps above protect every file still used by the current release.
# Nothing outside this dedicated public-asset directory is touched.
find "$history/assets" -type f -mtime +30 -delete
touch "$history/.bootstrapped"
echo "Retained $(find "$history/assets" -type f | wc -l | tr -d ' ') public assets"
