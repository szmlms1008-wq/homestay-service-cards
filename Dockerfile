FROM node:22-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ENV PORT=3000
EXPOSE 3000

RUN chmod +x /app/start.sh
CMD ["/app/start.sh"]
