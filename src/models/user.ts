import type { Socket } from "net";
import type { ChatRoomName } from "./chat-room.js";

export type UserName = string;

export interface User {
  userName: UserName;
  token: string;
  socket: Socket;
  chatRooms: ChatRoomName[];
  //   roomId?: number;
}
