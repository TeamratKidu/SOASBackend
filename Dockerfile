# Production-optimized Dockerfile for Render deployment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with production optimizations
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Set Node environment
ENV NODE_ENV=production

# Increase Node.js memory limit for Render free tier
ENV NODE_OPTIONS="--max-old-space-size=512"

# Start the application (production mode, no watch)
CMD ["node", "dist/main.js"]
