#!/bin/sh

# Redirect all output to stderr so it shows in logs even if stdout is buffered
exec 1>&2

echo "[启动] 开始启动流程 $(date)"
echo "[启动] 当前用户: $(whoami)"
echo "[启动] 工作目录: $(pwd)"
echo "[启动] 创建数据目录..."
mkdir -p /app/persist/data /app/persist/data/properties /app/persist/uploads || { echo "[错误] 创建目录失败"; exit 1; }
echo "[启动] Node.js $(node --version)"
echo "[启动] 检查关键文件..."
ls -la /app/app.js /app/db.js /app/start.sh
echo "[启动] 运行应用..."
exec node app.js
