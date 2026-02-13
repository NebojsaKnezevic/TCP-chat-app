import type { Message } from "../models/protocol.js";

export const ProtocolParser = {
  DELIMITER: "\n",
  serialize: (msg: Message): string => {
    return JSON.stringify(msg) + ProtocolParser.DELIMITER;
  },

  splitFrames: (data: string): { complete: string[]; incomplete: string } => {
    const result = data.split(ProtocolParser.DELIMITER);
    return {
      complete: result.slice(0, -1),
      incomplete: result[result.length - 1] || "",
    };
  },

  parseJSON: (raw: string): Message => {
    return JSON.parse(raw);
  },
};
