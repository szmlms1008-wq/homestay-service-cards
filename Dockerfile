FROM node:22

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN chmod +x start.sh

ENV DATA_DIR=/app/persist/data
ENV UPLOADS_DIR=/app/persist/uploads

EXPOSE 3000

CMD ["./start.sh"]
