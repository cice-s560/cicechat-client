const urlParams = new URLSearchParams(window.top.location.search);
const token = urlParams.get("token");
const $screen = document.getElementById("screen");
const $form = document.getElementById("message-form");
const $input = document.getElementById("message-input");

let socket;
let userData = {};

function addUserMessage(message) {
  $screen.innerHTML += `
    <div class="message">
      <figure>
        <img src="${message.user.picture}" >    
        <figcaption>${message.user.name}</figcaption>
      </figure>
      <p>${message.text}</p>
    </div>`;
}

function sendNewMessage(e) {
  e.preventDefault();
  socket.send(
    JSON.stringify({
      type: "MESSAGE",
      payload: {
        text: $input.value,
        user: {
          name: userData.username,
          picture: userData.picture
        }
      }
    })
  );
}

function addUserChat(user) {
  $screen.innerHTML += `<p class="has-text-primary is-size-7">el usuario <b>${user}</b> se ha conectado</p>`;
}

function messageReceived(e) {
  const message = JSON.parse(e.data);
  switch (message.type) {
    case "USER_CONNECTED":
      addUserChat(message.payload.username);
      break;
    case "MESSAGE_RECEIVED":
      addUserMessage(message.payload);
      break;
  }
}

function joinUserChat() {
// Conectamos con el servidor
socket = new WebSocket("ws://cicechat-socket.com:5000");
// Escuchamos la conexión con el servidor
socket.addEventListener("open", () => {
  // Cuando nos conectamos, comunicamos al mundo
  socket.send(
    JSON.stringify({
      type: "CONNECTION",
      payload: {
        username: userData.username
      }
    })
  );
  // Escuchamos cualquier mensaje
  socket.addEventListener("message", messageReceived);
  });
}

function getUserdata() {
  return fetch(`http://cicechat-auth.com:3000/userdata?token=${token}`, {
    headers: { "Content-Type": "application/json" }
  })
  .then(resp => {
    if (resp.status.toString() === "401") {
      return Promise.reject(new Error("Not logged"));
    }
    return resp.json();
  })
  .catch(err => {
    console.log(err);
    alert("No estás logado");
  });
}

getUserdata().then(data => {
  userData = data.user;
  document.getElementById("username").innerText = userData.username;
  $form.addEventListener("submit", sendNewMessage);
  joinUserChat();
});