// const net = require("net");
// const readline = require("node:readline").promises;

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// let userId = "unknown";

// const clearLine = (x) => {
//   return new Promise((res, rej) => {
//     process.stdout.clearLine(x, () => {
//       res();
//     });
//   });
// };

// const moveCursor = (dx, dy) => {
//   return new Promise((res, rej) => {
//     process.stdout.moveCursor(dx, dy, () => {
//       res();
//     });
//   });
// };

// const socket = net.createConnection(
//   { host: "127.0.0.1", port: 3010 },
//   async () => {
//     console.log("Connection to server!");

//     ask();
//   },
// );

// const ask = async () => {
//   const msg = await rl.question(`${userId} > `);
//   // movec the cursor one line up
//   await moveCursor(0, -1);
//   //clear tje current line that cursor is in
//   await clearLine(0);
//   socket.write(`${userId}-message-${msg}`);
// };

// socket.on("data", async (data) => {
//   const d = data.toString("utf-8");
//   const id = "id-";
//   if (d.startsWith(id)) {
//     userId = d.substring(id.length);
//   } else {
//     console.log();
//     await moveCursor(0, -1);
//     await clearLine(0);
//     console.log(d);
//   }

//   ask();
// });

// socket.on("end", () => {
//   console.log("Ended!");
// });

// socket.on("close", () => {
//   console.log("Closed!");
// });

// socket.on("error", (err) => {
//   console.log("Socket error:", err.message);
// });

// const net = require("net");
// const readline = require("readline");

// // Create interface for reading from the terminal
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// // Create a client connection
// const client = net.createConnection({ port: 8080 }, () => {
//   console.log("Connected to chat server");
//   console.log("Type a message and press Enter to send");

//   // Start reading user input
//   rl.prompt();
// });

// // Set encoding
// client.setEncoding("utf8");

// // Handle data from server
// client.on("data", (data) => {
//   // Move cursor to beginning of line and clear it
//   process.stdout.write("\r\x1b[K");

//   // Print the server message
//   console.log(data.trim());

//   // Re-display the prompt
//   rl.prompt();
// });

// // Handle connection end
// client.on("end", () => {
//   console.log("Disconnected from server");
//   rl.close();
//   process.exit(0);
// });

// // Handle errors
// client.on("error", (err) => {
//   console.error("Connection error:", err);
//   rl.close();
//   process.exit(1);
// });

// // Handle user input
// rl.on("line", (input) => {
//   // Send the user input to the server
//   client.write(input);
//   rl.prompt();
// });

// // Close the connection when the user exits
// rl.on("close", () => {
//   console.log("Exiting chat...");
//   client.end();
// });
import { createConnection } from "net";

const client = createConnection({ port: 3099 }, () => {
  console.log("connected to server");
  client.write("Hello from client");
});

client.setEncoding("utf-8");

client.on("data", (data) => {
  console.log("accepted: ", data);
});
