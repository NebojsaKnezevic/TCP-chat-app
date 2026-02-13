import type { Socket } from "net";
import type { ChatRoom } from "../models/chat-room.js";
import type { User, UserName } from "../models/user.js";

export class Repository {
  private rooms = new Map<string, ChatRoom>();
  private activeConnections = new Map<Socket, User>();
  private defaultRoom = "LOBBY";

  constructor() {
    this.rooms.set(this.defaultRoom, {
      id: 1,
      name: this.defaultRoom,
      users: new Map<string, User>(),
      messages: [],
      admin: [],
    });
  }

  isAuthenticated(s: Socket): Boolean {
    return this.activeConnections.has(s);
  }

  registerUser(user: User): Boolean {
    if (!this.activeConnections.has(user.socket)) {
      this.activeConnections.set(user.socket, user);
      const lobby = this.rooms.get(this.defaultRoom);
      lobby?.users.set(user.userName, user);
      return true;
    } else {
      return false;
    }
  }

  getUserBySocket(socket: Socket): User | undefined {
    if (this.isAuthenticated(socket)) {
      return this.activeConnections.get(socket);
    }

    return undefined;
  }

  getUserByName(userName: UserName): User | undefined {
    for (const [_, room] of this.rooms) {
      for (const [_, user] of room.users) {
        console.log(user.userName, user.userName === userName);
        if (user.userName === userName) {
          return user;
        }
      }
    }
    return undefined;
  }

  getRoom(roomName: string): ChatRoom | undefined {
    return this.rooms.get(roomName);
  }
}
