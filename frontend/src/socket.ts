import { io, Socket } from 'socket.io-client';
export const socket: Socket = io(`${window.location.protocol}//${window.location.host}`, { autoConnect: false });
