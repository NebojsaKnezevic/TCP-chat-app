import { createServer, Socket } from "net";
import { Repository } from "../repository/repository.js";
import { ServerService } from "../services/server/server-service.js";

const server = createServer();

const repository = new Repository();

server.on("connection", (socket: Socket) => {
  socket.setEncoding("utf-8");
  const service = new ServerService(repository, socket);

  socket.on("data", (data) => {
    service.handleRequest(data as Buffer);
  });

  socket.on("error", () => {
    console.log("Connection ended!");
    //for some reason this event gets triggered when client breaks the connection...
    service.handleDisconnect();
  });

  socket.on("drain", () => {
    socket.write("Hello from server");
  });
});

server.listen(3099, "127.0.0.1", () => {
  console.log("Server running! ", server.address());
});
