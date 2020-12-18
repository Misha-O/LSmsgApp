const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
// const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

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
  ${users.map((user) => `<li>${user.username}</li>`).join("")}
  `;
}
