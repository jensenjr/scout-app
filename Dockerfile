FROM node:20-alpine

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install && npm run build

COPY backend ./backend
RUN cp -r ./frontend/dist ./backend/public

RUN mkdir -p /app/backend/data

WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "src/index.js"]
