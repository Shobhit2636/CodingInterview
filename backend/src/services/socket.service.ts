import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface UserState {
  username: string;
  cursorColor: string;
  cursorPos?: { lineNumber: number; column: number };
}

interface RoomState {
  code: string;
  language: string;
  users: Record<string, UserState>;
}

// Global in-memory storage of collaborative interview room states
const rooms: Record<string, RoomState> = {};

export function initSocketService(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  console.log('Socket.io Service initialized.');

  io.on('connection', (socket) => {
    console.log(`Socket Client connected: ${socket.id}`);

    // Join room setup
    socket.on('join-room', ({ roomId, username, language }) => {
      socket.join(roomId);
      console.log(`User ${username} (${socket.id}) joined room ${roomId}`);

      // Initialize room state if empty
      if (!rooms[roomId]) {
        rooms[roomId] = {
          code: '',
          language: language || 'javascript',
          users: {}
        };
      }

      // Generate a vibrant color for the user cursor
      const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
      const userIndex = Object.keys(rooms[roomId].users).length;
      const cursorColor = colors[userIndex % colors.length];

      // Add user to room state
      rooms[roomId].users[socket.id] = {
        username,
        cursorColor
      };

      // Send initial state back to the newly joined client
      socket.emit('room-state', {
        code: rooms[roomId].code,
        language: rooms[roomId].language,
        users: rooms[roomId].users
      });

      // Broadcast updated user list to others in room
      socket.to(roomId).emit('user-joined', {
        id: socket.id,
        user: rooms[roomId].users[socket.id]
      });
    });

    // Editor code change synchronization
    socket.on('editor-change', ({ roomId, code }) => {
      if (rooms[roomId]) {
        rooms[roomId].code = code;
        // Broadcast the change to other users in the room
        socket.to(roomId).emit('editor-sync', { code });
      }
    });

    // Language synchronization
    socket.on('language-change', ({ roomId, language }) => {
      if (rooms[roomId]) {
        rooms[roomId].language = language;
        socket.to(roomId).emit('language-sync', { language });
      }
    });

    // Live cursor position broadcast
    socket.on('cursor-move', ({ roomId, cursorPos }) => {
      if (rooms[roomId] && rooms[roomId].users[socket.id]) {
        rooms[roomId].users[socket.id].cursorPos = cursorPos;
        socket.to(roomId).emit('cursor-sync', {
          userId: socket.id,
          username: rooms[roomId].users[socket.id].username,
          cursorColor: rooms[roomId].users[socket.id].cursorColor,
          cursorPos
        });
      }
    });

    // Room messaging
    socket.on('send-message', ({ roomId, username, text }) => {
      const message = {
        id: uuid(),
        username,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      io.to(roomId).emit('receive-message', message);
    });

    // WebRTC Peer signaling
    socket.on('webrtc-signal', ({ roomId, signal, to }) => {
      if (to) {
        io.to(to).emit('webrtc-signal', { signal, from: socket.id });
      } else {
        socket.to(roomId).emit('webrtc-signal', { signal, from: socket.id });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`Socket Client disconnected: ${socket.id}`);
      
      // Remove user from any room they were in
      for (const roomId in rooms) {
        if (rooms[roomId].users[socket.id]) {
          const departingUser = rooms[roomId].users[socket.id];
          delete rooms[roomId].users[socket.id];
          
          io.to(roomId).emit('user-left', {
            id: socket.id,
            username: departingUser.username
          });

          // Optional: Clean up room if completely empty
          if (Object.keys(rooms[roomId].users).length === 0) {
            delete rooms[roomId];
            console.log(`Cleaned up empty room: ${roomId}`);
          }
          break;
        }
      }
    });
  });
}

// Simple unique id generator for chat messages
function uuid() {
  return Math.random().toString(36).substring(2, 9);
}
