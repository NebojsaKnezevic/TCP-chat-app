import { createServer, Socket } from "net";

const server = createServer();

const clinets = [];

server.on("connection", (socket: Socket) => {
  socket.setEncoding("utf-8");
  socket.on("data", (data) => {
    console.log("Accepted:", data);
  });
  socket.on("error", () => {
    console.log("Connection ended!");
  });
  socket.write("Hello from server");
  socket.on("drain", () => {
    socket.write("Hello from server");
  });
});

server.listen(3099, "127.0.0.1", () => {
  console.log("Server running! ", server.address());
});
