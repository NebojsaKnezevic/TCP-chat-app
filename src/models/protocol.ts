import type { UserName } from "./user.js";
type MessageType = "AUTH" | "CHAT" | "ERROR" | "SYSTEM";

export interface Message {
  type: MessageType;
  payload: string;
  timestamp: number;
  sender: UserName;
  to?: UserName[];
}

export interface AuthMessage extends Message {
  type: "AUTH";
}

export interface ChatMessage extends Message {
  type: "CHAT";
  //   to?: UserName[];
  chatRoom: number;
}

export interface SystemMessage extends Message {
  type: "SYSTEM";
}

export interface ErrorMessage extends Message {
  type: "ERROR";
  code: number;
}
