#!/bin/bash
set -e

echo "[start] 开始初始化..."

mkdir -p /app/persist/data /app/persist/uploads
echo "[start] persist 目录已创建"

for dir in data uploads; do
  echo "[start] 处理 $dir 目录..."
  if [ ! -L "/app/$dir" ]; then
    echo "[start] $dir 不是符号链接，检查是否需要迁移..."
    if [ -d "/app/$dir" ] && [ "$(ls -A /app/$dir 2>/dev/null)" ] && [ ! "$(ls -A /app/persist/$dir 2>/dev/null)" ]; then
      echo "[start] 首次部署，迁移 $dir 数据..."
      cp -rn /app/$dir/* /app/persist/$dir/ 2>/dev/null || true
    fi
    echo "[start] 删除原有 $dir，创建符号链接..."
    rm -rf "/app/$dir"
    ln -sf "/app/persist/$dir" "/app/$dir"
    echo "[start] $dir 符号链接已创建"
  else
    echo "[start] $dir 已是符号链接，跳过"
  fi
done

mkdir -p /app/persist/data/properties /app/persist/data/backups
echo "[start] 数据持久化就绪，启动应用..."

exec node app.js 2>&1
