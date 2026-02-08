import { createConnection } from "net";
import { ProtocolParser } from "../services/parser.js";
import type { AuthMessage, Message } from "../models/protocol.js";

const client = createConnection({ port: 3099 }, () => {
  // console.log("connected to server");
  const msg: Message = {
    type: "ERROR",
    payload: "TEST TEST",
    timestamp: Number(new Date()),
    sender: "Guest",
    to: [""],
  };
  client.write(ProtocolParser.serialize(msg));
});

client.setEncoding("utf-8");

client.on("data", (data) => {
  console.log("accepted: ", data);
});
