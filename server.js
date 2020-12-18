const path = require("path"); // node core module
const http = require("http");
const express = require("express");
const socket = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getChatRoomUsers,
} = require("./utils/users");

// app setup
const app = express();
const server = http.createServer(app); //access directly to handle socket.io

// set static folder which serves files to server
app.use(express.static(path.join(__dirname, "public")));
const botName = "Service Bot";

// socket setup
const io = socket(server);

// run when client connects
io.on("connection", (socket) => {
  socket.on("joinChat", ({ username, chatRoom }) => {
    const user = userJoin(socket.id, username, chatRoom);

    socket.join(user.chatRoom);

    //   emits only to current user
    socket.emit("message", formatMessage(botName, "Welcome to LS Chat"));

    //   broadcast when client connects
    socket.broadcast
      .to(user.chatRoom)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // send chat users info to sidebar
    io.to(user.chatRoom).emit("chatUsers", {
      chatRoom: user.chatRoom,
      users: getChatRoomUsers(user.chatRoom),
    });
  });

  //   listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    // emit back to client
    io.to(user.chatRoom).emit("message", formatMessage(user.username, msg));
  });

  //   when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    // if exists
    if (user) {
      io.to(user.chatRoom).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      io.to(user.chatRoom).emit("chatUsers", {
        chatRoom: user.chatRoom,
        users: getChatRoomUsers(user.chatRoom),
      });
    }
  });
});

// if no 3000 will look for environment vrbl named port
const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => {
  console.log(`connection established on port: ${PORT}`);
});
