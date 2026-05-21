FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && npx prisma generate && npm prune --omit=dev

COPY . .

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "src/index.js"]
