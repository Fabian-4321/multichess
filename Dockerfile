FROM node:20

WORKDIR /app

COPY . .

RUN cd frontend && npm install && npm run build
RUN cd backend && npm install && npm run build

EXPOSE 3001
CMD ["node", "backend/dist/index.js"]
