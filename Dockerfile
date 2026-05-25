FROM node:20-alpine

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# --- 1. BACKEND DEPENDENCIES ---
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# --- 2. FRONTEND DEPENDENCIES ---
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# --- 3. FRONTEND BUILD ---
# Copy the rest of the frontend source files so Vite can find index.html
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# --- 4. BACKEND SOURCE & FINALIZE ---
COPY backend ./backend

# Ensure the backend/public directory exists, then copy the built assets
RUN mkdir -p ./backend/public && cp -r ./frontend/dist/* ./backend/public/
RUN mkdir -p /app/backend/data

WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "src/index.js"]
