# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Expose Vite default port
EXPOSE 5173

# Run in development mode with host exposure
CMD ["npm", "run", "dev", "--", "--host"]