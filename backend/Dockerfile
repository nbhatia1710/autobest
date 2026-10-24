FROM node:22-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=8000
ENV DATABASE_PATH=data/autobest.sqlite

EXPOSE 8000

CMD ["node", "src/server.js"]
