import { Socket } from "socket.io";
const express = require("express");
import http from "http";

const { Server } = require("socket.io");

const app = express();
const server = http.createServer(http);

const io = new Server(server);

io.on("connection", (socket: Socket) => {
  console.log("a user connected");
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
