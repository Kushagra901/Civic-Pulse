import http from "http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { initSocket } from "./modules/realtime/socket.js";

const app = createApp();
const server = http.createServer(app);
const io = initSocket(server);

// NOTE: For real production, you'd emit events from services.
// Here is a placeholder:
app.set("io", io);

server.listen(env.PORT, () => {
  console.log(`✅ API running on http://localhost:${env.PORT}`);
});
