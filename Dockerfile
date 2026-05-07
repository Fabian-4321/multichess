FROM node:20-slim

WORKDIR /app

COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install
COPY frontend/ ./
RUN npm run build

WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY backend/ ./
RUN npm run build

WORKDIR /app
ENV PORT=3001
EXPOSE 3001
CMD ["node", "backend/dist/index.js"]
