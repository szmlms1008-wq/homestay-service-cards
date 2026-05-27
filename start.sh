#!/bin/bash
set -e

mkdir -p /app/persist/data /app/persist/uploads

for dir in data uploads; do
  if [ ! -L "/app/$dir" ]; then
    if [ -d "/app/$dir" ] && [ "$(ls -A /app/$dir 2>/dev/null)" ] && [ ! "$(ls -A /app/persist/$dir 2>/dev/null)" ]; then
      cp -rn /app/$dir/* /app/persist/$dir/ 2>/dev/null || true
    fi
    rm -rf "/app/$dir"
    ln -sf "/app/persist/$dir" "/app/$dir"
  fi
done

mkdir -p /app/persist/data/properties /app/persist/data/backups
echo "[start] data persistence ready"

exec node app.js
