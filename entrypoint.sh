#!/bin/bash
set -e

# 将数据目录和上传目录链接到持久化卷
# 首次部署：创建目录并复制初始文件
# 后续部署：直接使用卷中的数据

for dir in data uploads; do
  # 如果 /app/$dir 不是软链接且已有内容，迁移到持久卷
  if [ ! -L "/app/$dir" ] && [ -d "/app/$dir" ] && [ "$(ls -A /app/$dir 2>/dev/null)" ]; then
    cp -rn /app/$dir/* /app/persist/$dir/ 2>/dev/null || true
  fi
  # 确保持久卷上有目录
  mkdir -p /app/persist/$dir
  # 删除原目录，创建软链接
  rm -rf /app/$dir
  ln -sf /app/persist/$dir /app/$dir
done

# 同样处理 data 内的子目录
mkdir -p /app/persist/data/properties /app/persist/data/backups

echo "[启动] 数据目录已链接到持久卷 /app/persist"

exec npm start
