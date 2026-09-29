// Centralizes all Socket.IO connection logic. Controllers emit events via
// req.app.get("io").emit(...) — this file just handles new connections.
function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("Dashboard client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Dashboard client disconnected:", socket.id);
    });
  });
}

module.exports = registerSocketHandlers;
