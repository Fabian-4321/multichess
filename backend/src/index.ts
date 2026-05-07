import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { registerHandlers } from './handlers';

const PORT = parseInt(process.env.PORT || '3001', 10);
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(express.static(path.resolve(__dirname, '../../frontend/dist')));
app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, '../../frontend/dist/index.html')));

registerHandlers(io);
httpServer.listen(PORT, () => console.log(`Server on port ${PORT}`));
