import { createServer, Socket } from "net";
import { ProtocolParser } from "../services/parser.js";
import type { AuthMessage, Message } from "../models/protocol.js";

const server = createServer();

const clinets = [];

server.on("connection", (socket: Socket) => {
  socket.setEncoding("utf-8");
  socket.on("data", (data) => {
    console.log("Accepted:", data);
    const deser = ProtocolParser.deserialize(data.toString());
    console.log(deser[0] && (JSON.parse(deser[0]) as AuthMessage));
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
