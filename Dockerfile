FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN chmod +x start.sh

ENV DATA_DIR=/app/persist/data
ENV UPLOADS_DIR=/app/persist/uploads

EXPOSE 3000

CMD ["./start.sh"]
