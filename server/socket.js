// server/socket.js
const jwt = require("jsonwebtoken");

function initSocket(io, { jwtSecret }) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("No token"));
      const payload = jwt.verify(token, jwtSecret);
      socket.user = { id: payload.id, role: payload.role };
      next();
    } catch (e) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    // Join collaboration room
    socket.on("collab:join", (collabId) => {
      if (!collabId) return;
      socket.join(`collab:${collabId}`);
    });

    // Fallback typing indicators (optional)
    socket.on("collab:typing", ({ collabId, typing }) => {
      if (!collabId) return;
      socket.to(`collab:${collabId}`).emit("collab:typing", {
        userId: socket.user?.id,
        typing: !!typing,
        at: Date.now(),
      });
    });
  });
}

module.exports = { initSocket };
