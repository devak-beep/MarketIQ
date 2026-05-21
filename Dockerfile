FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies and generate Prisma client
COPY server/package*.json ./server/
# Install dependencies (including dev) so Prisma CLI is available
RUN cd server && npm install --no-audit --no-fund

# Copy server source (includes prisma/schema.prisma required by `prisma generate`)
COPY server/ ./server/

# Generate Prisma client and prune dev dependencies for smaller production image
RUN cd server && npx prisma generate && npm prune --production

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "start"]
