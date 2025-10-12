// property.js — Updated for Live Render Backend

const API_URL = "https://real-estate-backend-1-s7p3.onrender.com/api/properties";
const API_BASE = "https://real-estate-backend-1-s7p3.onrender.com/api/admin";

/* helpers */
function getUser() {
  return JSON.parse(localStorage.getItem("user") || "{}");
}

function getToken() {
  return localStorage.getItem("token");
}

function getUserId() {
  const u = getUser();
  return u.user_id || u.id || null;  
}

function getUserRole() {
  const u = getUser();
  return (u.user_type || u.role || "").toString().toLowerCase();
}

function propIdOf(p) {
  return p.property_id || p.id || p.propertyId || p._id;
}

function toCurrency(n) {
  try { return Number(n).toLocaleString(); } catch { return n; }
}

function normalizeProps(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.results && Array.isArray(data.results)) return data.results;
  return [data];
}

/* ADD PROPERTY */
document.addEventListener("DOMContentLoaded", () => {
  const addForm = document.getElementById("addPropertyForm");
  if (!addForm) return;

  const thumbInput = document.getElementById("thumbnailInput") || document.getElementById("thumbnail");
  const thumbPreview = document.getElementById("thumbnailPreview");

  if (thumbInput && thumbPreview) {
    thumbInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        thumbPreview.src = URL.createObjectURL(file);
        thumbPreview.style.display = "block";
      }
    });
  }

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(addForm);

    // Always attach seller_id
    const uid = getUserId();
    if (uid) formData.append("seller_id", uid);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add property");

      alert("✅ Property created");
      const newId = data.property_id || data.id || data.propertyId;
      if (newId) window.location.href = `property.html?id=${newId}`;
      else window.location.href = "myProperties.html";
    } catch (err) {
      alert("❌ Failed to add property: " + err.message);
      console.error(err);
    }
  });
});

/* EDIT PROPERTY */
document.addEventListener("DOMContentLoaded", () => {
  const editForm = document.getElementById("editPropertyForm");
  if (!editForm) return;

  const propId = new URLSearchParams(window.location.search).get("id");
  if (!propId) {
    alert("❌ No property selected.");
    return;
  }

  (async function loadProp() {
    try {
      const res = await fetch(`${API_URL}/${propId}`, {
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {}
      });
      if (!res.ok) throw new Error(`Failed to load property (${res.status})`);
      const property = await res.json();

      if (document.getElementById("title")) document.getElementById("title").value = property.title || "";
      if (document.getElementById("description")) document.getElementById("description").value = property.description || "";
      if (document.getElementById("price")) document.getElementById("price").value = property.price || "";
      if (document.getElementById("location")) document.getElementById("location").value = property.location || "";
      const thumbImg = document.getElementById("currentThumb") || document.getElementById("editThumbnailPreview");
      if (thumbImg) thumbImg.src = property.thumbnail ? `https://real-estate-backend-1-s7p3.onrender.com/uploads/${property.thumbnail}` : "default.jpg";
    } catch (err) {
      alert("❌ Failed to load property: " + err.message);
      console.error(err);
    }
  })();

  const editThumbInput = document.getElementById("thumbnail");
  const editThumbPreview = document.getElementById("currentThumb") || document.getElementById("editThumbnailPreview");
  if (editThumbInput && editThumbPreview) {
    editThumbInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) editThumbPreview.src = URL.createObjectURL(file);
    });
  }

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(editForm);

    try {
      const res = await fetch(`${API_URL}/${propId}`, {
        method: "PUT",
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");

      alert("✅ Property updated");
      window.location.href = `property.html?id=${propId}`;
    } catch (err) {
      alert("❌ Failed to update property: " + err.message);
      console.error(err);
    }
  });

  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) deleteBtn.addEventListener("click", () => deleteMyProperty(propId));
});

/* PROPERTY DETAILS */
document.addEventListener("DOMContentLoaded", () => {
  const propId = new URLSearchParams(window.location.search).get("id");
  if (!propId || !document.getElementById("propTitle")) return;

  (async function loadDetails() {
    try {
      const res = await fetch(`${API_URL}/${propId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch property (${res.status})`);
      const property = await res.json();

      const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text ?? "";
      };

      setText("propTitle", property.title || "Untitled");
      setText("propDescription", property.description || "");
      setText("propPrice", "₦" + (property.price ?? ""));
      setText("propLocation", property.location ? `📍 ${property.location}` : "");
      setText("propStatus", property.status ? `Status: ${property.status}` : "");
      setText("sellerInfo", (property.first_name || "") + " " + (property.last_name || ""));

      const img = document.getElementById("propertyImage");
      if (img) img.src = property.thumbnail ? `https://real-estate-backend-1-s7p3.onrender.com/uploads/${property.thumbnail}` : "default.jpg";

      // Message Seller button
      const msgContainer = document.getElementById("messageSellerContainer");
      if (msgContainer) {
        const sellerId = property.seller_id || property.user_id;
        const uid = getUserId();

        if (sellerId && String(uid) !== String(sellerId)) {
          msgContainer.innerHTML = `
            <button class="btn-message" id="messageSellerBtn">
              <i class="fa-solid fa-envelope"></i> Message Seller
            </button>`;
          const btn = document.getElementById("messageSellerBtn");
          if (btn) {
            btn.onclick = () => {
              const sellerName = encodeURIComponent(
                (property.first_name || "") + " " + (property.last_name || "")
              );
              const targetUrl = `message.html?seller_id=${sellerId}&property_id=${propId}&seller_name=${sellerName}`;

              if (!getToken()) {
                localStorage.setItem("redirectAfterLogin", targetUrl);
                localStorage.setItem("forceLogin", "true");
                window.location.href = "login.html";
              } else {
                window.location.href = targetUrl;
              }
            };
          }
        } else {
          msgContainer.innerHTML = "";
        }
      }

      const user = getUser();
      const uid = getUserId();
      const role = getUserRole();
      const ownerId = property.seller_id || property.user_id;
      if (user && (role === "admin" || String(uid) === String(ownerId))) {
        const actions = document.getElementById("actionButtons");
        if (actions) {
          actions.innerHTML = `
            <button id="detailEditBtn" class="btn-primary">Edit</button>
            <button id="detailDeleteBtn" class="btn-danger">Delete</button>
          `;
          document.getElementById("detailEditBtn").onclick = () => window.location.href = `editProperty.html?id=${propId}`;
          document.getElementById("detailDeleteBtn").onclick = () => deleteMyProperty(propId);
        }
      }
    } catch (err) {
      alert("❌ Failed to load property details: " + err.message);
      console.error(err);
    }
  })();
});

/* DELETE LISTING */
async function _deletePropertyRequest(propertyId) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/${propertyId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Delete failed");
  return data;
}

window.deleteMyProperty = async (propertyId) => {
  if (!confirm("Are you sure you want to delete this property?")) return;
  try {
    const result = await _deletePropertyRequest(propertyId);
    alert(result.message || "Property deleted");
    const el = document.querySelector(`[data-id="${propertyId}"]`);
    if (el) el.remove();
    else window.location.href = "myProperties.html";
  } catch (err) {
    alert("❌ Failed to delete: " + err.message);
    console.error(err);
  }
};

window.deleteProperty = window.deleteMyProperty;
window.editProperty = (propertyId) => {
  window.location.href = `editProperty.html?id=${propertyId}`;
};

/* LIST PROPERTIES */
document.addEventListener("DOMContentLoaded", () => {
  const propertyList = document.getElementById("propertyList");
  if (!propertyList) return;

  (async function loadList() {
    try {
      let url = `${API_URL}`;
      const role = getUserRole();
      const uid = getUserId();
      if (role === "seller" && uid) url += `?sellerId=${uid}`;

      const res = await fetch(url, { headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {} });
      if (!res.ok) throw new Error("Failed to load properties");
      const data = await res.json();

      const props = normalizeProps(data);
      if (props.length === 0) {
        propertyList.innerHTML = "<p>No properties found.</p>";
        return;
      }

      propertyList.innerHTML = props.map(prop => {
        const id = propIdOf(prop);
        return `
          <div class="property-card" data-id="${id}">
            <img src="${prop.thumbnail ? `https://real-estate-backend-1-s7p3.onrender.com/uploads/${prop.thumbnail}` : "default.jpg"}" 
                 alt="Property" class="property-thumb">
            <div class="property-details">
              <h3>${prop.title || ""}</h3>
              <p class="price">₦${toCurrency(prop.price)}</p>
              <p>📍 ${prop.location || ""}</p>
              <p>Status: ${prop.status || "N/A"}</p>
              <button class="btn-danger" onclick="deleteProperty('${id}')">Delete</button>
            </div>
          </div>
        `;
      }).join("");
    } catch (err) {
      alert("❌ Failed to load property list: " + err.message);
      console.error(err);
    }
  })();
});

/* MY PROPERTIES */
document.addEventListener("DOMContentLoaded", () => {
  const myPropertyList = document.getElementById("myPropertyList");
  if (!myPropertyList) return;

  (async function loadMine() {
    try {
      const uid = getUserId();
      const role = getUserRole();
      const token = getToken();
      if (!token || role !== "seller" || !uid) {
        alert("You must be logged in as a Seller to view this page.");
        window.location.href = "login.html";
        return;
      }

      const res = await fetch(`${API_URL}?sellerId=${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load properties");
      const data = await res.json();

      const props = normalizeProps(data);
      if (props.length === 0) {
        myPropertyList.innerHTML = "<p>You haven't added any properties yet.</p>";
        return;
      }

      myPropertyList.innerHTML = props.map(prop => {
        const id = propIdOf(prop);
        return `
          <div class="property-card" data-id="${id}">
            <img src="${prop.thumbnail ? `https://real-estate-backend-1-s7p3.onrender.com/uploads/${prop.thumbnail}` : "default.jpg"}" 
                 alt="Property" class="property-thumb">
            <div class="property-details">
              <h3>${prop.title || ""}</h3>
              <p class="price">₦${toCurrency(prop.price)}</p>
              <p>📍 ${prop.location || ""}</p>
              <p>Status: ${prop.status || "N/A"}</p>
              <p>Seller: ${[prop.first_name, prop.last_name].filter(Boolean).join(" ")}</p>
              <p>${(prop.description || "").slice(0, 120)}${(prop.description && prop.description.length > 120) ? "..." : ""}</p>
              <button class="btn-primary" onclick="editProperty('${id}')">Edit</button>
              <button class="btn-danger" onclick="deleteMyProperty('${id}')">Delete</button>
            </div>
          </div>
        `;
      }).join("");
    } catch (err) {
      alert("❌ Failed to load your properties: " + err.message);
      console.error(err);
      myPropertyList.innerHTML = "<p>❌ Could not load your properties.</p>";
    }
  })();
});
