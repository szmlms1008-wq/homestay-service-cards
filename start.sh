#!/bin/bash
set -e
echo "[start] 开始部署..."

# 确保 data 和 uploads 目录存在
mkdir -p /app/data/properties /app/data/backups /app/uploads

echo "[start] 启动 Node.js..."
exec node app.js
