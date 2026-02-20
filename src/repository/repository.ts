import type { Socket } from "net";
import type { ChatRoom, ChatRoomName } from "../models/chat-room.ts";
import type { User, UserName } from "../models/user.ts";

export class Repository {
  private rooms = new Map<ChatRoomName, ChatRoom>();
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
        // console.log(user.userName, user.userName === userName);
        if (user.userName === userName) {
          return user;
        }
      }
    }
    return undefined;
  }

  getUsers(room: ChatRoom, filter: (user: User) => boolean) {
    const r = this.rooms.get(room.name);
    if (r) {
      return [...r.users.values()].filter(filter);
    }
    return [];
  }

  getRoom(roomName: string): ChatRoom | undefined {
    return this.rooms.get(roomName);
  }

  getRooms(): Map<string, ChatRoom> {
    return this.rooms;
  }

  createRoom(roomName: string, adminUser: User, key = ""): ChatRoom {
    const room = {
      id: Date.now(),
      name: roomName,
      users: new Map(),
      messages: [],
      admin: [adminUser],
      key: key,
    };
    this.rooms.set(roomName, room);

    return room;
  }

  removeUser(s: Socket) {
    const user = this.activeConnections.get(s);
    if (!user) return;

    // (this, this.activeConnections.delete(s));
    this.activeConnections.delete(s);
    for (const [_, room] of this.rooms) {
      if (room.users.has(user.userName)) {
        room.users.delete(user.userName);
      }
    }
  }

  joinRoom(user: User, room: ChatRoom) {
    const oldRoom = this.rooms.get(user.chatRooms[0]);
    for (const [_, r] of this.rooms) {
      r.users.delete(user.userName);
    }

    room.users.set(user.userName, user);
    user.chatRooms = [room.name];
    const newRoom = this.rooms.get(user.chatRooms[0]);
    return [oldRoom, newRoom];
  }
}
