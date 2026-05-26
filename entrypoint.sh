#!/bin/bash
set -e

# 确保持久卷上有数据目录
mkdir -p /app/persist/data/properties /app/persist/data/backups /app/persist/uploads

echo "[启动] 数据目录：/app/persist"

exec npm start
