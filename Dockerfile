FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY server.js .
COPY index.html .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
