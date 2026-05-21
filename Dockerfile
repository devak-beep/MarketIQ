FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production --no-audit --no-fund

# Copy server source
COPY server/ ./server/

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "start"]
