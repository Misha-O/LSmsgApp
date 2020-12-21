const notification = document.querySelector(".notification");
const logWindow = document.querySelector(".login");
const logInput = document.querySelector(".login__input");
const logBtn = document.querySelector(".login__btn");
const chatContainer = document.querySelector(".chat");
const currentContainerName = document.querySelector(".current__user");
const usersContainer = document.querySelector(".users");
const sendBtn = document.querySelector(".send__btn");
const msgInput = document.querySelector(".send__input");
const messagesContainer = document.querySelector(".messages");
const userAvatar = document.querySelector(".user_avatar");

let socket = null; //to use it inside functions
let userName = "";

logBtn.addEventListener("click", (e) => {
  socket = new WebSocket("ws://localhost:3000");
  // listen for events received from server, which before we received by clicking 'enter', opened ws and send to the server
  socket.addEventListener("open", () => {
    logWindow.classList.add("hidden");
    chatContainer.classList.remove("hidden");
    userName = logInput.value;
    currentContainerName.textContent = userName;
    userAvatar.setAttribute("data-avatar", userName);
    // create object with username to send to server
    const request = {
      type: "login",
      name: userName,
    };
    // ws can operate strings only, thus
    socket.send(JSON.stringify(request));
  });

  // set up event
  socket.addEventListener("message", (e) => {
    // storing object with data
    const wsObjReceived = JSON.parse(e.data);

    // from prev 'request obj' determine type(its value)
    switch (wsObjReceived.type) {
      case "login":
        if (wsObjReceived.fromUser !== userName) {
          showNotification(`User ${wsObjReceived.fromUser} entered the chat`);
        }
        outputChatUsers(wsObjReceived.data);
        break;
      case "log-out":
        showNotification(`User ${wsObjReceived.fromUser} has left the chat`);
        outputChatUsers(wsObjReceived.data);
        break;
      case "message":
        outputMessage(wsObjReceived.data);
        break;
      case "avatar":
        updateAvatar(wsObjReceived.data);
        if (wsObjReceived.fromUser !== userName) {
          showNotification(
            `User ${wsObjReceived.fromUser} has changed the profile picture`
          );
        }
      default:
        break;
    }
  });
});

sendBtn.addEventListener("click", () => {
  const message = msgInput.value;

  const request = {
    type: "message",
    data: message,
  };
  socket.send(JSON.stringify(request));
  msgInput.value = "";
  msgInput.focus();
});

function outputChatUsers(users) {
  usersContainer.innerHTML = `
  ${users
    .map(
      (user) => `
      <li class="user__item">
        <div class="avatar" data-avatar="${user.userLogin}">
          <img src="${
            user.image ? user.image : "/img/no-photo.png"
          }" alt="User profile photo" />
        </div>
        <div class="user__name">${user.userLogin}</div>
      </li>`
    )
    .join("")}
  `;
}

function outputMessage(wsObjReceived) {
  const date = new Date();
  const hours = String(date.getHours()).padStart(2, 0); //pads string(with 0) to given length (2)
  const minutes = String(date.getMinutes()).padStart(2, 0);
  const time = `${hours}:${minutes}`;

  const div = document.createElement("div");
  div.classList.add("message");

  div.innerHTML = `
  <div class="avatar" data-avatar="${wsObjReceived.fromUser}">
    <img src="${
      wsObjReceived.image ? wsObjReceived.image : "/img/no-photo.png"
    }" alt="" />
  </div>
  <div class="message-data">
    <div class="user__name">${
      wsObjReceived.fromUser
    }  <span class="message__time">${time}</span></div>
    <div class="text">${wsObjReceived.message}</div>
  </div>`;

  messagesContainer.append(div);
}

function showNotification(message) {
  notification.textContent = message;
  notification.classList.add("active");

  setTimeout(() => {
    notification.classList.remove("active");
  }, 3000);
}

userAvatar.addEventListener("dragover", (e) => {
  if (e.dataTransfer.items.length && e.dataTransfer.items[0].kind === "file") {
    e.preventDefault();
  }
});

userAvatar.addEventListener("drop", (e) => {
  const file = e.dataTransfer.items[0].getAsFile();

  const formData = new FormData();
  formData.append("image", file);

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then(({ image }) => {
      const request = {
        type: "avatar",
        data: image,
      };
      socket.send(JSON.stringify(request));
    });

  e.preventDefault();
});

function updateAvatar(wsObjReceived) {
  const avatarsDom = document.querySelectorAll(
    `.avatar[data-avatar="${wsObjReceived.fromUser}"] img`
  );

  for (const img of avatarsDom) {
    img.src = wsObjReceived.image;
  }
}
