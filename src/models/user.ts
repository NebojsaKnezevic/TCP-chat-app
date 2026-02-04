import type { Socket } from "net";

export type UserName = string;

export interface User {
  userName: UserName;
  token?: string;
  socket: Socket;
  //   roomId?: number;
}
