FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=80
ENV DATA_DIR=/app/data

EXPOSE 80

CMD ["node", "server.mjs"]
