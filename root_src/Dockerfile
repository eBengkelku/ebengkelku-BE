# Use Node.js 22 Alpine as base image
FROM node:22-alpine

# Set working directory
WORKDIR /var/www/app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files first for better Docker layer caching
COPY package*.json pnpm-lock.yaml* ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Create dist directory and copy i18n files
RUN mkdir -p dist/src && \
    if [ -d "src/i18n" ]; then cp -r src/i18n dist/; fi

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3004

# Create startup script that ensures i18n files are available
RUN echo '#!/bin/sh' > /startup.sh && \
    echo 'mkdir -p dist/src' >> /startup.sh && \
    echo 'if [ -d "src/i18n" ]; then cp -r src/i18n dist/ 2>/dev/null || true; fi' >> /startup.sh && \
    echo 'exec pnpm run start:dev' >> /startup.sh && \
    chmod +x /startup.sh

# Start the application
CMD ["/startup.sh"]