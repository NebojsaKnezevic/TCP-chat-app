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
import type { ChatRoom } from "../models/chat-room.js";

export class ServerService {
  private repository: Repository;
  private user: User;
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
    switch (msg.type) {
      case "CHAT":
        console.log("CHAT message routed!");
        break;
      case "AUTH":
        console.log("AUTH message routed!");
        this.handleAuthentication(msg as AuthMessage);
        break;
      case "SYSTEM":
        console.log("SYSTEM message routed!");
        // this.handleAuthentication(msg as AuthMessage);
        break;
      default:
        console.log("Unknown message type!");
    }
  }

  private handleAuthentication(msg: AuthMessage) {
    try {
      const payload: string[] = msg.payload.split(" ");

      if (payload.length !== 3) {
        this.systemMsg(
          `Invalid auth command! UserName and Token must be one word. Example @AUTH JohnDoe 12345.`,
          [],
          400,
        );
        return;
      }

      const [prefix, userName, token] = payload;
      if (!userName) {
        this.errorMsg(`UserName not defined!`, [], 500);
        return;
      }

      if (!token) {
        this.errorMsg(`Token not defined!`, [], 500);
        return;
      }

      const userExists: User | undefined =
        this.repository.getUserByName(userName);
      if (userExists !== undefined) {
        this.systemMsg(
          `User by the name of ${userExists.userName} already exists, pick another name!`,
          [this.user.userName],
          401,
        );
        return;
      }

      this.user.userName = userName;
      this.user.token = token;

      if (this.repository.registerUser(this.user)) {
        this.systemMsg(
          `Welcome ${this.user.userName}! You are now in the lobby!`,
          [this.user.userName],
          200,
        );
        this.systemMsg(
          `Pick a room from the list: [${this.roomList()}]`,
          [this.user.userName],
          200,
        );
        this.systemMsg(`Or create your own!`, [this.user.userName], 200);
      } else {
        this.errorMsg(
          `Registration failed, try again later.`,
          [this.user.userName],
          500,
        );
      }
    } catch (error) {
      //write error msg
      this.user.socket.write(
        `Payload: ${msg.payload} is not valid JSON! Please send your registration as { "firstName": "value", "token": "value" }`,
      );
    }
  }

  public handleDisconnect() {
    this.repository.removeUser(this.user?.socket);
  }

  private systemMsg(payloadMsg: string, to: UserName[], code: number) {
    const response: SystemMessage = {
      type: "SYSTEM",
      payload: payloadMsg,
      timestamp: Date.now(),
      sender: "SYSTEM",
      to: to,
      code: code,
    };
    this.user?.socket.write(ProtocolParser.serialize(response));
  }

  private errorMsg(payloadMsg: string, to: UserName[], codeNumber: number) {
    const response: ErrorMessage = {
      type: "ERROR",
      payload: payloadMsg,
      timestamp: Date.now(),
      sender: "SYSTEM",
      code: codeNumber,
      to: to,
    };
    this.user?.socket.write(ProtocolParser.serialize(response));
  }

  private roomList(): string {
    let avaiableRooms: string[] = [];

    for (let [roomName, _] of this.repository.getRooms()) {
      avaiableRooms.push(roomName);
    }

    return avaiableRooms.join(`, `);
  }
}
