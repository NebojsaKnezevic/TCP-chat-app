import type { ChatMessage } from "./protocol.js";
import type { User, UserName } from "./user.js";

export interface ChatRoom {
  id: number;
  name: string;
  users: Map<UserName, User>;
  messages: ChatMessage[];
}
