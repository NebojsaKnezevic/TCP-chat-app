import type { Socket } from "net";
import * as readline from "node:readline/promises";
import type { Message, MessageType } from "../models/protocol.js";
import { ProtocolParser } from "./parser.js";

export class ClientService {
  private socket: Socket;
  private rl: readline.Interface;
  private accumulationBuffer: string = "";
  private userName = "";
  private token = "";

  constructor(s: Socket) {
    this.socket = s;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "> ",
    });
  }

  //   setSocket(s: Socket) {
  //     this.socket = s;
  //   }

  private async auth() {
    this.userName = await this.rl.question("USERNAME: ");
    this.token = await this.rl.question("TOKEN: ");

    const msg: Message = {
      type: "AUTH",
      payload: `/AUTH ${this.userName} ${this.token}`,
      timestamp: Number(new Date()),
      sender: this.userName,
      to: [""],
    };

    this.socket.write(ProtocolParser.serialize(msg));
  }

  private async chat() {
    this.rl.prompt();
    for await (const line of this.rl) {
      let msgType: MessageType = "CHAT";

      if (line.startsWith("/")) {
        msgType = "COMMAND";
      }

      const msg: Message = {
        type: msgType,
        payload: line,
        timestamp: Date.now(),
        sender: this.userName,
        to: [],
      };

      this.socket.write(ProtocolParser.serialize(msg));
      this.rl.prompt();
    }
  }

  private onData() {
    this.socket.on("data", async (data) => {
      this.accumulationBuffer += data.toString();
      //   console.log("accumulationBuffer: ", this.accumulationBuffer);

      const { complete, incomplete } = ProtocolParser.splitFrames(
        this.accumulationBuffer,
      );

      this.accumulationBuffer = incomplete;

      for (const jsonString of complete) {
        try {
          const msg: Message = ProtocolParser.parseJSON(jsonString.toString());
          process.stdout.write("\r\x1b[K");

          console.log(
            `${new Date(msg.timestamp).toLocaleTimeString()} ${msg.sender}: ${msg.payload}`,
          );

          if (msg.code === 401) {
            await this.auth();
            break;
          }

          this.rl.prompt();
        } catch (error) {
          console.error("Error while parsing message: ", jsonString);
        }
      }
    });
  }

  async run() {
    setTimeout(async () => await this.auth(), 1000);
    this.onData();
    await this.chat();
  }
}
