# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .
# Copy default config.js (can be overwritten at runtime)
COPY public/config.js ./config.js
COPY public/vite.svg ./vite.svg
# Copy nginx config if needed (optional)
# COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"] 