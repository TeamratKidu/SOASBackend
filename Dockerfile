# Production-optimized Dockerfile for Render deployment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Increase memory for build process
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Remove --only=production to install devDependencies needed for compilation
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Verify build output
RUN ls -la dist/ && echo "Build completed successfully"

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies (no devDependencies needed at runtime)
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Verify copied files
RUN ls -la && ls -la dist/ && echo "Files copied to production stage"

# Expose port
EXPOSE 3000

# Set Node environment
ENV NODE_ENV=production

# Runtime memory limit for Render free tier
ENV NODE_OPTIONS="--max-old-space-size=512"

# Start the application
CMD ["node", "dist/src/main.js"]
