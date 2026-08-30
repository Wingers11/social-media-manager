FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app
COPY . .

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "index.js"]
