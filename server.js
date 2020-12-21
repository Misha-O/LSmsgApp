const http = require("http");
const path = require("path"); //node core module
const express = require("express");
const multer = require("multer"); // load files on server side

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

const WebSocket = require("ws");

// app setup
const app = express();

// set static folder which serves files to server
app.use(express.static(path.join(__dirname, "public")));

// upload images as avatars
// route which on POST with url 'upload'. Then multer will load img -> in req with property file we receive all info
app.post("/upload", upload.single("image"), (req, res) => {
  res.status(200).send({ image: `/photos/${req.file.filename}` });
});

// start server
const server = http.createServer(app);

// socket setup(to operate in one port)
const webSocketServer = new WebSocket.Server({ server });

// to hold keys and values received from ws(after parsing)
const connections = new Map();

// run when client connects
webSocketServer.on("connection", (socket) => {
  // storing data (key, value)
  connections.set(socket, {});

  socket.on("message", (message) => {
    // to get object with data instead of simple string and define further actions from server
    const wsObjReceived = JSON.parse(message);
    // console.log(wsObjReceived);

    switch (wsObjReceived.type) {
      case "login":
        connections.get(socket).userLogin = wsObjReceived.name;
        connections.get(socket).image = "";

        // setting up initial login and Boolean false, no broadcast, but if other user joins Boolean === true and socket opens
        broadcastMessage(
          {
            type: "login",
            data: [...connections.values()]
              .map((item) => ({
                userLogin: item.userLogin,
                image: item.image,
              }))
              .filter(Boolean),
          },
          socket,
          false
        );
        break;

      case "message":
        const message = wsObjReceived.data;
        broadcastMessage(
          {
            type: "message",
            data: {
              message,
              fromUser: connections.get(socket).userLogin,
              image: connections.get(socket).image,
            },
          },
          socket,
          false
        );
        break;

      case "avatar":
        const image = wsObjReceived.data;
        connections.get(socket).image = image;

        broadcastMessage(
          {
            type: "avatar",
            data: {
              image,
              fromUser: connections.get(socket).userLogin,
            },
          },
          socket,
          false
        );
        break;

      default:
        break;
    }
  });

  socket.on("close", () => {
    console.log("Disconnect");
    broadcastMessage(
      {
        type: "log-out",
        data: [...connections.values()]
          .map(
            (item) =>
              connections.get(socket).userLogin !== item.userLogin &&
              item.userLogin
          )
          .filter(Boolean),
      },
      socket
    );
    connections.delete(socket);
  });
});

function broadcastMessage(message, fromUser, excludeSelf = true) {
  const socketData = connections.get(fromUser);

  if (!socketData) return false;

  // define user login of sender
  message.fromUser = socketData.userLogin;

  for (const connection of connections.keys()) {
    if (connection === fromUser && excludeSelf) {
      continue;
    }

    connection.send(JSON.stringify(message));
  }
}

// if no 3000 will look for environment vrbl named port
const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => {
  console.log(`connection established on port: ${PORT}`);
});
