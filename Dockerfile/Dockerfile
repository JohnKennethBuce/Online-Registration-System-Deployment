# -------------------------------
# Stage 1: Build Frontend (React + Vite)
# -------------------------------
FROM node:18 as build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# -------------------------------
# Stage 2: Build Backend (Laravel)
# -------------------------------
FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git curl zip unzip libpng-dev libonig-dev libxml2-dev libzip-dev && \
    docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy Laravel code
WORKDIR /var/www/html
COPY backend ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Copy built React frontend into Laravel's public folder
COPY --from=build-frontend /app/frontend/dist ./public

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expose port 8000
EXPOSE 8000

# Start Laravel with Artisan
CMD php artisan serve --host=0.0.0.0 --port=8000
