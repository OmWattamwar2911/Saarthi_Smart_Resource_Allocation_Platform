FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

# Start backend using the required root-level entrypoint.
CMD ["node", "server.js"]
