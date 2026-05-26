FROM node:22-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 初始化持久卷目录结构
RUN mkdir -p /app/persist/data/properties /app/persist/data/backups /app/persist/uploads \
    && chmod +x /app/entrypoint.sh

ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
