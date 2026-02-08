import type { ChatMessage } from "./protocol.js";
import type { User, UserName } from "./user.js";

export type ChatRoomName = string;

export interface ChatRoom {
  id: number;
  name: ChatRoomName;
  users: Map<UserName, User>;
  messages: ChatMessage[];
  admin: User[];
  key?: string;
}
