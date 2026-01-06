# Development Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Set environment variables for development
ENV NODE_ENV=development
ENV PORT=9002
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for development)
RUN npm ci

# Copy source code
COPY . .

# Generate database schema
RUN npm run db:generate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 9002

# Start development server with hot reload
CMD ["npm", "run", "dev"]
