const urlParams = new URLSearchParams(window.top.location.search);
const token = urlParams.get("token");
const $screen = document.getElementById("screen");
const $form = document.getElementById("message-form");
const $input = document.getElementById("message-input");
// Init emoji picker
new MeteorEmoji();

let socket;
let userData = {};

function addUserMessage(message) {
  const element = document.createElement('div');
  element.innerHTML += `
    <div class="message message--${ userData._id === message.user.id ? 'own' : 'theirs' }">
      <div class="columns is-marginless">
        <div class="column is-1">
          <img class="is-fullwidth" src="${ message.user.picture }">
        </div>
        <div class="column is-11">
          <h4 class="has-text-black">${ message.user.name }</h4>
          <p>${ message.text }</p>
        </div>
      </div>
    </div>`;
  $screen.appendChild(element);
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
          picture: userData.picture,
          id: userData._id
        }
      }
    })
  );
  $input.value = '';
}

function addUserChat(user, disconnected) {
  const element = document.createElement('div');
  element.innerHTML = `<p class="message has-text-${ disconnected ? 'danger' : 'primary' } is-size-7">
    El usuario <b>${ user }</b> se ha ${ disconnected ? 'desconectado' : 'conectado' }
  </p>`;
  $screen.appendChild(element);
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
    case "USER_DISCONNECTED":
      addUserChat(message.payload.username, true);
      break;
  }
  $screen.scrollTop = $screen.scrollHeight;
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