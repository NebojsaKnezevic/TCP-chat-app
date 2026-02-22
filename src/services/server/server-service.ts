import { Socket } from "net";
import type { User, UserName } from "../../models/user.js";
import { Repository } from "../../repository/repository.js";
import type {
  AuthMessage,
  ChatMessage,
  CommandMessage,
  ErrorMessage,
  Message,
  MessageType,
  SystemMessage,
} from "../../models/protocol.js";
import { ProtocolParser } from "../parser.js";
import type { ChatRoom, ChatRoomName } from "../../models/chat-room.js";
import { AuthHandler } from "./auth/auth-handler.js";
import { CommandHandler } from "./command/command-handler.js";

export class ServerService {
  private repository: Repository;
  private user: User;
  private accumulationBuffer: string = "";
  private lobby: ChatRoom | undefined;
  private auth: AuthHandler;
  private cmd: CommandHandler;

  constructor(repo: Repository, socket: Socket) {
    this.repository = repo;
    // this.user = this.repository.getUserBySocket(socket);

    this.user = {
      userName: "GUEST",
      token: "",
      socket: socket,
      chatRooms: ["LOBBY"],
    };

    this.lobby = this.repository.getRoom("LOBBY");

    this.auth = new AuthHandler(
      this.repository,
      this.user,
      this.systemMsg.bind(this),
      this.errorMsg.bind(this),
      this.roomList.bind(this),
      this.lobby,
    );

    this.cmd = new CommandHandler(
      this.repository,
      this.systemMsg.bind(this),
      this.errorMsg.bind(this),
      this.sendMsgToRoom.bind(this),
      this.user,
      this.roomList,
    );
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
        console.log("CHAT message routed!", msg.payload);
        this.handleChatMessage(msg as ChatMessage);
        break;
      case "AUTH":
        console.log("AUTH message routed!");
        this.auth.handleAuth(msg as AuthMessage);
        break;
      case "COMMAND":
        console.log("SYSTEM message routed!");
        this.cmd.handleCommand(msg as CommandMessage);
        // this.handleAuthentication(msg as AuthMessage);
        break;
      default:
        console.log("Unknown message type!");
    }
  }

  private handleChatMessage(msg: ChatMessage) {
    const roomName: ChatRoomName = this.user.chatRooms[0];
    const room: ChatRoom | undefined = this.repository.getRoom(roomName);
    let roomMembers: UserName[] = [];
    if (room) {
      roomMembers = [...room.users.values()]
        .filter((u) => u.userName !== this.user.userName)
        .map((u) => u.userName);
    }

    this.msg(msg, roomMembers, roomName);
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
      code: code,
    };
    this.msg(response, to);
  }

  private errorMsg(payloadMsg: string, to: UserName[], codeNumber: number) {
    const response: ErrorMessage = {
      type: "ERROR",
      payload: payloadMsg,
      timestamp: Date.now(),
      sender: "SYSTEM",
      code: codeNumber,
    };
    this.msg(response, to);
  }

  private sendMsgToRoom(
    type: MessageType,
    payloadMsg: string,
    to: UserName[],
    codeNumber: number,
    roomName: ChatRoomName,
  ) {
    const response: Message = {
      type: type,
      payload: payloadMsg,
      timestamp: Date.now(),
      sender: "SYSTEM",
      code: codeNumber,
    };
    this.msg(response, to, roomName);
  }

  private msg(response: Message, to: UserName[], roomName?: ChatRoomName) {
    roomName = roomName || this.user.chatRooms[0];
    if (roomName) {
      const room = this.repository.getRoom(roomName);
      for (const user of to) {
        room?.users
          .get(user as UserName)
          ?.socket.write(ProtocolParser.serialize(response));
      }
    }
  }

  private roomList(): string {
    let avaiableRooms: string[] = [];

    for (let [roomName, _] of this.repository.getRooms()) {
      avaiableRooms.push(roomName);
    }

    return avaiableRooms.join(`, `);
  }
}
