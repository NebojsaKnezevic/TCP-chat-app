import type { Message } from "../models/protocol.js";

export const ProtocolParser = {
  DELIMITER: "\n",
  serialize: (msg: Message): string => {
    return JSON.stringify(msg) + ProtocolParser.DELIMITER;
  },
  deserialize: (data: string): string[] => {
    //Here we split by delimiter and we ommit the last element, since it is incomplete
    return data.split(ProtocolParser.DELIMITER).slice(0, -1);
  },
};
