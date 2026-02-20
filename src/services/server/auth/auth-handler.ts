import { Socket } from "net";
import { AuthMessage, Message } from "../../../models/protocol.js";
import { Repository } from "../../../repository/repository.js";
import { ServerService } from "../server-service.js";
import { User, UserName } from "../../../models/user.js";
import { ChatRoom } from "../../../models/chat-room.js";

export class AuthHandler {
  constructor(
    private repository: Repository,
    private user: User,
    private systemMsg: (payload: string, to: UserName[], code: number) => void,
    private errorMsg: (payload: string, to: UserName[], code: number) => void,
    private roomList: () => string,
    private lobby: ChatRoom | undefined,
  ) {}

  public handleAuth(msg: AuthMessage) {
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
        if (this.lobby) {
          this.repository.joinRoom(this.user, this.lobby);
        }

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
}
