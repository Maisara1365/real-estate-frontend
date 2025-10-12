const API_BASE = "https://real-estate-backend-1-s7p3.onrender.com/api/admin";
const PROPERTIES_API = "https://real-estate-backend-1-s7p3.onrender.com/api/properties";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const noCacheUrl = `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`;
  const res = await fetch(noCacheUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Request failed");
  }
  return await res.json();
}

// Sidebar
document.querySelectorAll(".sidebar-menu li").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".sidebar-menu li").forEach((li) =>
      li.classList.remove("active")
    );
    item.classList.add("active");
    const sectionId = item.dataset.section;
    document
      .querySelectorAll(".section")
      .forEach((sec) => sec.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");
    document.getElementById("section-title").textContent =
      sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  });
});

// Animate counter
function animateCounter(element, value) {
  let start = 0;
  const end = parseInt(value, 10);
  const duration = 1000;
  const stepTime = Math.abs(Math.floor(duration / end)) || 20;
  const timer = setInterval(() => {
    start += 1;
    element.textContent = start;
    if (start >= end) clearInterval(timer);
  }, stepTime);
}

// Reports
async function loadReports() {
  try {
    const data = await apiFetch(`${API_BASE}/reports`);
    animateCounter(document.getElementById("totalUsers"), data.users);
    animateCounter(document.getElementById("totalProperties"), data.properties);
    animateCounter(document.getElementById("totalMessages"), data.messages);
    animateCounter(document.getElementById("totalActions"), data.admin_actions);
    if (data.recent_admin_actions) loadAdminActions(data.recent_admin_actions);
  } catch (err) {
    console.error("Error loading reports:", err);
  }
}

// Admin Actions
function loadAdminActions(actions = null) {
  const recentTbody = document.querySelector("#recentActions tbody");
  const logsTbody = document.querySelector("#logsTable tbody");

  const renderRows = (list, tbody) => {
    tbody.innerHTML = "";
    if (!list || list.length === 0) {
      tbody.innerHTML = "<tr><td colspan='5'>No actions found</td></tr>";
      return;
    }
    list.forEach((a) => {
      let badgeClass = "";
      const type = (a.action_type || "").toUpperCase();
      if (type.includes("DELETE")) badgeClass = "badge badge-delete";
      else if (type.includes("ADD") || type.includes("CREATE"))
        badgeClass = "badge badge-add";
      else if (type.includes("UPDATE") || type.includes("EDIT"))
        badgeClass = "badge badge-update";
      else if (type.includes("LOGIN") || type.includes("LOGOUT"))
        badgeClass = "badge badge-login";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.action_id || ""}</td>
        <td><span class="${badgeClass}">${a.action_type || ""}</span></td>
        <td>${a.action_details || "-"}</td>
        <td>${(a.admin_first || "") + " " + (a.admin_last || "")}</td>
        <td>${new Date(a.action_date).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  if (actions) {
    renderRows(actions, recentTbody);
    renderRows(actions, logsTbody);
  } else {
    apiFetch(`${API_BASE}/actions`)
      .then((data) => {
        renderRows(data, recentTbody);
        renderRows(data, logsTbody);
      })
      .catch(() => {
        recentTbody.innerHTML =
          "<tr><td colspan='5'>Failed to load actions</td></tr>";
        logsTbody.innerHTML =
          "<tr><td colspan='5'>Failed to load actions</td></tr>";
      });
  }
}

// Users
async function loadUsers() {
  try {
    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";
    const data = await apiFetch(`${API_BASE}/users`);
    tbody.innerHTML = "";
    data.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.user_id}</td>
        <td>${u.first_name} ${u.last_name}</td>
        <td>${u.email}</td>
        <td>${u.user_type}</td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
        <td>
          <button class="action-btn delete-btn" onclick="deleteUser(${u.user_id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  try {
    await apiFetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
    loadUsers();
    loadReports();
    loadAdminActions();
  } catch (err) {
    console.error("Delete user failed:", err);
  }
}

// Properties
async function loadProperties() {
  try {
    const tbody = document.querySelector("#propertiesTable tbody");
    tbody.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";
    const data = await apiFetch(`${API_BASE}/properties`);
    tbody.innerHTML = "";
    data.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.property_id}</td>
        <td>${p.title}</td>
        <td>₦${p.price}</td>
        <td>${p.location}</td>
        <td>${p.first_name} ${p.last_name} (${p.email})</td>
        <td>
          <button class="action-btn update-btn" onclick="editProperty(${p.property_id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteProperty(${p.property_id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading properties:", err);
  }
}

async function deleteProperty(id) {
  if (!confirm("Are you sure you want to delete this property?")) return;
  try {
    await apiFetch(`${PROPERTIES_API}/${id}`, { method: "DELETE" });
    loadProperties();
    loadReports();
    loadAdminActions();
  } catch (err) {
    console.error("Delete property failed:", err);
  }
}

function editProperty(id) {
  window.location.href = `editProperty.html?id=${id}`;
}

// Messages
async function loadMessages() {
  try {
    const tbody = document.querySelector("#messagesTable tbody");
    tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";
    const data = await apiFetch(`${API_BASE}/messages`);
    tbody.innerHTML = "";
    data.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.sender_name}</td>
        <td>${m.receiver_name}</td>
        <td>${m.snippet}</td>
        <td>${new Date(m.created_at).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading messages:", err);
  }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadReports();
  loadUsers();
  loadProperties();
  loadMessages();
  loadAdminActions();
});
