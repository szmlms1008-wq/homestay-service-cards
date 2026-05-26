FROM node:22-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ENV DATA_DIR=/app/persist/data
ENV UPLOADS_DIR=/app/persist/uploads
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
