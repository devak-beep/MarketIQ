FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies and generate Prisma client
COPY server/package*.json ./server/
# install all dependencies (including dev) so Prisma CLI is available,
# generate the Prisma client, then remove dev dependencies for a smaller image
RUN cd server && npm install --no-audit --no-fund && npx prisma generate && npm prune --production

# Copy server source
COPY server/ ./server/

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "start"]
