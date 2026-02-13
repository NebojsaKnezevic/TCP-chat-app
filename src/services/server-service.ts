import { Socket } from "net";
import type { User, UserName } from "../models/user.js";
import { Repository } from "../repository/repository.js";
import type {
  AuthMessage,
  ErrorMessage,
  Message,
  SystemMessage,
} from "../models/protocol.js";
import { ProtocolParser } from "./parser.js";

export class ServerService {
  private repository: Repository;
  private user: User | undefined;
  private accumulationBuffer: string = "";

  constructor(repo: Repository, socket: Socket) {
    this.repository = repo;
    // this.user = this.repository.getUserBySocket(socket);

    this.user = {
      userName: "GUEST",
      token: "",
      socket: socket,
      chatRooms: [],
    };
  }

  // Here we are receiving binnary data over network stream.
  // It could be incomplete or multiple messages or combination of the two....
  public handleRequest(chunk: Buffer) {
    const decodedChunk = chunk.toString("utf-8");

    this.accumulationBuffer += decodedChunk;

    const { complete, incomplete } = ProtocolParser.splitFrames(
      this.accumulationBuffer,
    );

    //We must save the incomplete message!
    this.accumulationBuffer = incomplete;

    //And at last we process complete messages
    for (const jsonString of complete) {
      this.processMessage(jsonString);
    }
  }

  private processMessage(jsonString: string): void {
    try {
      const msg: Message = ProtocolParser.parseJSON(jsonString);
      //Routing
      this.router(msg);
    } catch (error) {
      //return warning or error msg.
    }
  }

  private router(msg: Message) {
    console.log(
      `[Routing] Type: ${msg.type} from ${this.user ? this.user.userName : "unknown"}`,
    );

    switch (msg.type) {
      case "CHAT":
        console.log("CHAT message routed!");
        break;
      case "AUTH":
        console.log("AUTH message routed!");
        this.handleAuthentication(msg as AuthMessage);
        break;
      default:
        console.log("Unknown message type!");
    }
  }

  private handleAuthentication(msg: AuthMessage) {
    try {
      const payload: { userName: UserName; token: string } = JSON.parse(
        msg.payload,
      );

      if (this.user) {
        const userExists: User | undefined = this.repository.getUserByName(
          payload.userName,
        );
        if (userExists !== undefined) {
          const response: SystemMessage = {
            type: "SYSTEM",
            payload: `User by the name of ${userExists.userName} already exists, pick another name!`,
            timestamp: Date.now(),
            sender: "SYSTEM",
            to: [this.user.userName],
          };
          this.user.socket.write(ProtocolParser.serialize(response));
          return;
        }

        this.user.userName = payload.userName;
        this.user.token = payload.token;

        if (this.repository.registerUser(this.user)) {
          const response: SystemMessage = {
            type: "SYSTEM",
            payload: `Welcome ${this.user.userName}! You are now in the lobby!`,
            timestamp: Date.now(),
            sender: "SYSTEM",
            to: [this.user.userName],
          };
          this.user.socket.write(ProtocolParser.serialize(response));
        } else {
          const response: ErrorMessage = {
            type: "ERROR",
            payload: `Registration failed, try again later.`,
            timestamp: Date.now(),
            sender: "SYSTEM",
            to: [this.user.userName],
            code: 500,
          };
          this.user.socket.write(ProtocolParser.serialize(response));
        }
      }
    } catch (error) {
      //write error msg
      this.user?.socket.write(
        `Payload: ${msg.payload} is not valid JSON! Please send your registration as { "firstName": "value", "token": "value" }`,
      );
    }

    // const user: User = {
    //    userName: "";
    //     token: "";
    //     socket: this.s;
    //     chatRooms: ChatRoomName[];
    // }
    // this.repository.registerUser(msg);
  }
}
