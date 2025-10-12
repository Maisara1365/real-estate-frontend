/* message.js — Modern chat with typing + notifications (Live Render) */
const MSG_API = "https://real-estate-backend-1-s7p3.onrender.com/api/messages";

/* Helpers */
function getToken() { return localStorage.getItem("token"); }
function getUser() { return JSON.parse(localStorage.getItem("user") || "{}"); }
function getUserId() { const u = getUser(); return u.user_id || u.id || null; }

/* DOM references */
const threadList = document.getElementById("threads");
const convHeader = document.getElementById("conversationHeader");
const convMessages = document.getElementById("conversationMessages");
const sendForm = document.getElementById("sendMessageForm");
const msgInput = document.getElementById("messageInput");
const searchInput = document.getElementById("searchInput");
const typingIndicator = document.getElementById("typingIndicator");

let currentReceiverId = null;
let currentPropertyId = null;
let lastMessageIds = {}; // Track latest message ID per thread
let typingTimeout;

/* Load threads */
async function loadThreads() {
  try {
    const res = await fetch(`${MSG_API}/threads`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to load threads");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      threadList.innerHTML = "<p>No conversations yet.</p>";
      return;
    }

    const seen = new Set();
    threadList.innerHTML = "";

    data.forEach(msg => {
      const otherId = msg.sender_id === getUserId() ? msg.receiver_id : msg.sender_id;
      if (seen.has(otherId)) return;
      seen.add(otherId);

      const otherName = msg.sender_id === getUserId()
        ? `${msg.receiver_first} ${msg.receiver_last}`
        : `${msg.sender_first} ${msg.sender_last}`;

      const preview = (msg.message_text || msg.content || "").slice(0, 25) + "...";

      const div = document.createElement("div");
      div.className = "thread-item";
      div.dataset.otherId = otherId;
      div.innerHTML = `<strong>${otherName}</strong><br><small>${preview}</small>`;
      div.onclick = () => loadConversation(otherId, msg.property_id, otherName, div);
      threadList.appendChild(div);

      lastMessageIds[otherId] = msg.id;
    });
  } catch (err) {
    console.error(err);
    threadList.innerHTML = "<p>❌ Failed to load threads.</p>";
  }
}

/* Load conversation */
async function loadConversation(otherId, propertyId, otherName, element) {
  currentReceiverId = otherId;
  currentPropertyId = propertyId;

  document.querySelectorAll(".thread-item").forEach(el => el.classList.remove("active", "new-message"));
  if (element) element.classList.add("active");

  convHeader.innerHTML = `<h2>${otherName}</h2><span class="status online">Online</span>`;
  convMessages.innerHTML = "<p>Loading...</p>";

  try {
    const url = `${MSG_API}/conversation?property_id=${propertyId}&other_user_id=${otherId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to load conversation");
    const data = await res.json();

    convMessages.innerHTML = "";
    data.forEach(msg => {
      const div = document.createElement("div");
      div.className = "message " + (msg.sender_id === getUserId() ? "sent" : "received");
      div.textContent = msg.message_text || msg.content;
      div.setAttribute("data-time", new Date(msg.created_at || Date.now()).toLocaleTimeString());
      convMessages.appendChild(div);
    });

    convMessages.scrollTop = convMessages.scrollHeight;
  } catch (err) {
    console.error(err);
    convMessages.innerHTML = "<p>❌ Failed to load conversation.</p>";
  }
}

/* Send message */
sendForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentReceiverId) {
    alert("❌ Select a conversation first.");
    return;
  }

  const content = msgInput.value.trim();
  if (!content) return;

  try {
    const res = await fetch(MSG_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        receiver_id: currentReceiverId,
        property_id: currentPropertyId,
        content
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send message");

    const div = document.createElement("div");
    div.className = "message sent";
    div.textContent = content;
    div.setAttribute("data-time", new Date().toLocaleTimeString());
    convMessages.appendChild(div);
    convMessages.scrollTop = convMessages.scrollHeight;

    msgInput.value = "";
  } catch (err) {
    console.error(err);
    alert("❌ Failed to send message: " + err.message);
  }
});

/* Typing indicator */
msgInput.addEventListener("input", () => {
  typingIndicator.style.display = "block";
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    typingIndicator.style.display = "none";
  }, 2000);
});

/* Search filter */
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  document.querySelectorAll(".thread-item").forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(query) ? "block" : "none";
  });
});

/* New message notifications */
async function refreshThreads() {
  try {
    const res = await fetch(`${MSG_API}/threads`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) return;
    const data = await res.json();

    data.forEach(msg => {
      const otherId = (msg.sender_id === getUserId()) ? msg.receiver_id : msg.sender_id;
      const latestId = msg.id;
      const threadEl = [...document.querySelectorAll(".thread-item")]
        .find(el => el.dataset.otherId === String(otherId));

      if (threadEl) {
        if (lastMessageIds[otherId] && latestId > lastMessageIds[otherId]) {
          if (currentReceiverId !== otherId) {
            threadEl.classList.add("new-message");
            playNotificationSound();
          }
        }
      }
      lastMessageIds[otherId] = latestId;
    });
  } catch (err) {
    console.error("Thread refresh failed", err);
  }
}

function playNotificationSound() {
  const audio = new Audio("notify.mp3"); // Add a sound file in your project
  audio.play().catch(() => {});
}

/* Handle query params */
const params = new URLSearchParams(window.location.search);
const sellerId = params.get("seller_id");
const propertyId = params.get("property_id");
const sellerName = params.get("seller_name");
if (sellerId && propertyId) {
  loadConversation(parseInt(sellerId), parseInt(propertyId), sellerName);
}

/* Initial load */
loadThreads();
setInterval(refreshThreads, 10000); // poll every 10s
