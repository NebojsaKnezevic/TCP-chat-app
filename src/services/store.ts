import type { ChatRoom } from "../models/chat-room.js";
import type { User } from "../models/user.js";

export class Repository {
  private rooms = new Map<string, ChatRoom>();
  constructor() {
    this.rooms.set("LOBBY", {
      id: 1,
      name: "LOBBY",
      users: new Map<string, User>(),
      messages: [],
      admin: [],
    });
  }
}
