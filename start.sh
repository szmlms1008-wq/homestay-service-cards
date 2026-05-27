#!/bin/sh
set -e
echo "[启动] 创建数据目录..."
mkdir -p /app/persist/data /app/persist/data/properties /app/persist/uploads
echo "[启动] Node.js $(node --version)"
echo "[启动] 运行应用..."
exec node app.js
