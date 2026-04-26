FROM node:20-alpine

WORKDIR /app

# COPY package*.json ./
# RUN npm install --production --fetch-retry-mintimeout 20000 --fetch-retry-maxtimeout 120000 --fetch-retries 5

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]