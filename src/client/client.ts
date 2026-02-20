process.removeAllListeners("warning");
process.env.NODE_NO_WARNINGS = "1";

import { createConnection } from "net";
import { ClientService } from "../services/client/client-service.js";

const client = createConnection({ port: 3099 });
client.setEncoding("utf-8");

new ClientService(client).run();

// client.on("data", (data) => {
//   const msg: Message = ProtocolParser.parseJSON(data.toString());
//   // console.log("accepted: ", data);
//   // rl.write(
//   //   `${new Date(msg.timestamp).toLocaleTimeString()} ${msg.sender}: ${msg.payload} \n`,
//   // );
//   // if()
// });

// rl.on("line", (line: string) => {
//   if (line.trim()) {
//     client.write(line);
//   }
//   rl.prompt();
// });
