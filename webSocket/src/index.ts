import { WebSocketServer } from "ws";
import { UserManager } from "@/lib/UserManager";

const webSocketServer = new WebSocketServer({ port: 8080 });

webSocketServer.on("connection", (userSocket) => {
  UserManager.getInstance().addUser(userSocket);
});
