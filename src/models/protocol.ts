import type { UserName } from "./user.js";
export type MessageType = "AUTH" | "CHAT" | "ERROR" | "SYSTEM" | "COMMAND";

export interface Message {
  type: MessageType;
  payload: string;
  timestamp: number;
  sender: UserName;
  // to: UserName[];
  code?: number;
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
}

export interface CommandMessage extends Message {
  type: "COMMAND";
}
