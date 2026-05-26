#!/bin/bash
set -e
mkdir -p /app/persist/data/properties /app/persist/data/backups /app/persist/uploads
echo "[start] 数据目录已初始化"
exec node app.js
