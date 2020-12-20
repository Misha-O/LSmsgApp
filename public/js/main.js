const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const userList = document.getElementById("users");
const userAvatar = document.querySelector(".user--avatar");
const currentUser = document.querySelector(".current--user");

// get username from URL
// Qs library to query string from http address, to ignore spec characters add ignoreQueryPrefix
const { username, chatRoom } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// join chatroom
socket.emit("joinChat", { username, chatRoom });

// get chat users
socket.on("chatUsers", ({ users }) => {
  outputChatUsers(users);
});

// listen for events received from server, which before we received from user actions and send to the server
socket.on("message", (message) => {
  outputMessage(message);

  //   scroll down on msg
  chatMessages.scrollTop = chatMessages.scrollHeight; //set to chatMsg height
});

// message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  //   get msg text
  const msg = e.target.elements.msg.value;

  //   emitting msg to the server
  socket.emit("chatMessage", msg);
  //   clear msg inputs
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// output message to DOM
//bz msg already object, format inside to access value
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time} </span></p>
  <p class="text">${message.text}</p>`;
  document.querySelector(".chat-messages").appendChild(div);
}

function outputChatUsers(users) {
  userList.innerHTML = `
  ${users
    .map(
      (user) => `
      <li class="user--item">
      <div class="avatar" data-avatar="${user.username}">
      <img src="${user.image ? user.image : "/img/no-photo.png"}" alt="" />
      </div>
      <div class="user--name">${user.username}</div>
      </li>`
    )
    .join("")}
  `;
}

socket.on("imgLoad", ({ data }) => {
  updateAvatar(data.data);
});

userAvatar.addEventListener("drop", (e) => {
  const file = e.dataTransfer.items[0].getAsFile();
  // construct a set of key/value pairs representing form fields and their values
  const formData = new FormData();
  // appends value file to a key image
  formData.append("image", file);

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((image) => {
      const request = {
        type: "avatar",
        data: image,
      };
      console.log(request);
      socket.send(JSON.stringify(request));
    });
  e.preventDefault();
});

userAvatar.addEventListener("dragover", (e) => {
  // if any elem exist and it is a file(taking first element [0])
  if (e.dataTransfer.items.length && e.dataTransfer.items[0].kind === "file") {
    e.preventDefault();
  }
});
