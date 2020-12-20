const path = require("path"); // node core module
const http = require("http");
const express = require("express");
const socket = require("socket.io");
const multer = require("multer"); //loads files on server side
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getChatRoomUsers,
} = require("./utils/users");

// img upload setup
// all files stored on server as file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/photos");
  },
  // this is to reassign file names
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
// call multer
const upload = multer({ storage });

// app setup
const app = express();
const server = http.createServer(app); //access directly to handle socket.io

// set static folder which serves files to server
app.use(express.static(path.join(__dirname, "public")));
const botName = "Service Bot";

// socket setup(to operate in one port)
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

    // socket.broadcast.to(user.chatRoom).emit("imgLoad", (data) => {
    //   const image = data.data;
    //   io.to(user.chatRoom).emit("imgLoad");
    // });
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

// upload images as avatars
// route which on POST with url 'upload'. Then multer will load img -> in req with property file we receive all info
app.post("/upload", upload.single("image"), (req, res) => {
  res.status(200).send({ image: `/photos/${req.file.filename}` });
});
