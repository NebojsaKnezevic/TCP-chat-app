import { ChatRoomName } from "../../../models/chat-room.js";
import { CommandMessage, MessageType } from "../../../models/protocol.js";
import { User, UserName } from "../../../models/user.js";
import { Repository } from "../../../repository/repository.js";

export class CommandHandler {
  constructor(
    private repository: Repository,
    private systemMsg: (payload: string, to: UserName[], code: number) => void,
    private errorMsg: (payload: string, to: UserName[], code: number) => void,
    private sendMsgToRoom: (
      type: MessageType,
      payloadMsg: string,
      to: UserName[],
      codeNumber: number,
      roomName: ChatRoomName,
    ) => void,
    private user: User,
    private roomList: () => string,
  ) {}

  public handleCommand(msg: CommandMessage) {
    if (msg.payload.startsWith("/create-room ")) {
      this.createRoom(msg);
    } else if (msg.payload.startsWith("/join-room ")) {
      this.joinRoom(msg);
    } else if (msg.payload === "/list-room") {
      // this.joinRoom(msg);
      this.roomListCommand();
    } else if (msg.payload === "/my-room") {
      // this.joinRoom(msg);
      this.myRoomCommand();
    } else {
      this.errorMsg("Invalid command.", [this.user.userName], 400);
    }
  }

  private createRoom(msg: CommandMessage) {
    const [_, roomName, roomKey] = msg.payload.split(" ");
    if (roomName) {
      //check if room exists
      const roomExists = this.repository.getRoom(roomName);
      if (!roomExists) {
        //create room
        const newRoom = this.repository.createRoom(
          roomName,
          this.user,
          roomKey || "",
        );
        // this.repository.joinRoom(this.user, newRoom);
        this.systemMsg(
          `Room ${newRoom.name} has been created! Type /join-room ${newRoom.name}`,
          [this.user.userName],
          200,
        );
      } else {
        this.errorMsg(
          `Room under the name of ${roomName} already exists. Pick another name!`,
          [this.user.userName],
          400,
        );
      }
    } else {
      this.errorMsg("Please provide the room name.", [this.user.userName], 400);
    }
  }

  private joinRoom(msg: CommandMessage) {
    const [_, roomName, roomKey] = msg.payload.split(" ");
    if (roomName) {
      //check if room exitsts
      const room = this.repository.getRoom(roomName);
      if (room) {
        if (room.key === (roomKey || "")) {
          //first remove the user from the old room.
          const [oldRoom, _] = this.repository.joinRoom(this.user, room);
          room.users.set(this.user.userName, this.user);
          //msg to user
          this.systemMsg(
            `Welcome ${this.user.userName} you have succesfully joined the room ${room.name}.`,
            [this.user.userName],
            200,
          );

          if (oldRoom && oldRoom.name !== "LOBBY") {
            this.sendMsgToRoom(
              `SYSTEM`,
              `User ${this.user.userName} has left the chat.`,
              [...oldRoom.users.values()].map((x) => x.userName),
              200,
              oldRoom.name,
            );
          }

          //announce that user joined to room to others
          const users = this.repository.getUsers(
            room,
            (user) => user.userName !== this.user.userName,
          );

          this.systemMsg(
            `User ${this.user.userName} has joined the room! Say HI.`,
            users.map((x) => x.userName),
            200,
          );
        } else {
          if (roomKey) {
            this.errorMsg("Invalid password.", [this.user.userName], 400);
          } else {
            this.errorMsg(
              "Please provide the password.",
              [this.user.userName],
              400,
            );
          }
        }
      } else {
        this.errorMsg(
          `Room ${roomName} doesn't exists.`,
          [this.user.userName],
          404,
        );
      }
    } else {
      this.errorMsg("Please provide the room name.", [this.user.userName], 400);
    }
  }

  private roomListCommand() {
    this.systemMsg(`List: [${this.roomList()}]`, [this.user.userName], 200);
  }

  private myRoomCommand() {
    this.systemMsg(
      `Current room: ${this.user.chatRooms[0]}`,
      [this.user.userName],
      200,
    );
  }
}
