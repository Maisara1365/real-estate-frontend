let currentPage = 1;
const limit = 6;
let currentQuery = "";

const API_BASE = "https://real-estate-backend-1-s7p3.onrender.com/api/properties";
const IMAGE_BASE = "https://real-estate-backend-1-s7p3.onrender.com/uploads"; // for property images

// Helper: build URL to backend /api/properties
function buildPropertiesUrl(query, page) {
  if (query && query.startsWith("?")) {
    return `${API_BASE}${query}&page=${page}&limit=${limit}`;
  } else if (query) {
    return `${API_BASE}?${query}&page=${page}&limit=${limit}`;
  } else {
    return `${API_BASE}?page=${page}&limit=${limit}`;
  }
}

// Fetch properties (with pagination + current filter query)
async function fetchProperties(query = "", page = 1) {
  currentPage = page;
  currentQuery = query || "";

  const propertyList = document.getElementById("propertyList");
  propertyList.innerHTML = "<p>Loading properties…</p>";

  try {
    const url = buildPropertiesUrl(currentQuery, currentPage);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    const properties = data.results || [];
    const totalPages =
      data.totalPages ??
      Math.ceil((data.totalResults || properties.length) / limit);
    const pageFromBackend = data.currentPage ?? currentPage;

    renderProperties(properties);
    renderPagination(totalPages, pageFromBackend);
  } catch (err) {
    console.error("Error fetching properties:", err);
    propertyList.innerHTML = `<p style="color:red;">Failed to load properties. Check console for details.</p>`;
    document.getElementById("pagination").innerHTML = "";
  }
}

// Render property cards
function renderProperties(properties) {
  const propertyList = document.getElementById("propertyList");
  propertyList.innerHTML = "";

  if (!properties || properties.length === 0) {
    propertyList.innerHTML = "<p>No properties found.</p>";
    return;
  }

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");

  properties.forEach((property) => {
    const card = document.createElement("div");
    card.className = "property-card";

    // Build full image URL (if thumbnail exists)
    let imageUrl = "default.jpg";
    if (property.thumbnail) {
      imageUrl = `${IMAGE_BASE}/${property.thumbnail}`;
    }

    const sellerId = property.seller_id ?? property.user_id ?? property.userId;

    let html = `
      <img src="${imageUrl}" alt="${escapeHtml(
      property.title || "Property"
    )}" onerror="this.src='default.jpg'">
      <div class="details">
        <h3>${escapeHtml(property.title || "")}</h3>
        <p class="price">₦${property.price ?? ""}</p>
        <p><strong>Location:</strong> ${escapeHtml(property.location ?? "")}</p>
        <p><strong>Status:</strong> ${escapeHtml(property.status ?? "")}</p>
        <a href="property.html?id=${
          property.property_id
        }" class="btn">View Details</a>
    `;

    if (token) {
      if (userRole && userRole.toLowerCase() === "admin") {
        html += ` <button class="btn admin-delete" data-id="${property.property_id}">Delete</button>`;
      }
      if (
        userRole &&
        userRole.toLowerCase() === "seller" &&
        userId &&
        Number(userId) === Number(sellerId)
      ) {
        html += ` <a href="edit-property.html?id=${property.property_id}" class="btn">Edit</a>`;
        html += ` <button class="btn owner-delete" data-id="${property.property_id}">Delete</button>`;
      }
    }

    html += `</div>`;
    card.innerHTML = html;
    propertyList.appendChild(card);
  });

  // Delete buttons
  document.querySelectorAll(".admin-delete, .owner-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Are you sure you want to delete this property?")) return;

      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_BASE}/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Delete failed: ${res.status}`);
        }
        fetchProperties(currentQuery, currentPage);
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete property. Check console for details.");
      }
    });
  });
}

// Render pagination controls
function renderPagination(totalPages, activePage = 1) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (!totalPages || totalPages <= 1) return;

  if (activePage > 1) {
    const prev = document.createElement("button");
    prev.textContent = "Prev";
    prev.addEventListener("click", () =>
      fetchProperties(currentQuery, activePage - 1)
    );
    pagination.appendChild(prev);
  }

  const maxButtons = 7;
  let start = Math.max(1, activePage - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === activePage) btn.classList.add("active");
    btn.addEventListener("click", () => fetchProperties(currentQuery, i));
    pagination.appendChild(btn);
  }

  if (activePage < totalPages) {
    const next = document.createElement("button");
    next.textContent = "Next";
    next.addEventListener("click", () =>
      fetchProperties(currentQuery, activePage + 1)
    );
    pagination.appendChild(next);
  }
}

// Utility: escape HTML
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Filter form
document.getElementById("filterForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const location = document.getElementById("location").value;
  const minPrice = document.getElementById("minPrice").value;
  const maxPrice = document.getElementById("maxPrice").value;
  const status = document.getElementById("status").value;

  const params = new URLSearchParams();
  if (location) params.append("location", location);
  if (minPrice) params.append("minPrice", minPrice);
  if (maxPrice) params.append("maxPrice", maxPrice);
  if (status) params.append("status", status);

  currentQuery = params.toString() ? `?${params.toString()}` : "";
  fetchProperties(currentQuery, 1);
});

// Hero slideshow
function initHeroSlideshow() {
  const slides = document.querySelectorAll(".hero-slideshow .slide");
  if (!slides.length) return;

  let currentIndex = 0;
  slides[currentIndex].classList.add("active");

  setInterval(() => {
    slides[currentIndex].classList.remove("active");
    currentIndex = (currentIndex + 1) % slides.length;
    slides[currentIndex].classList.add("active");
  }, 5000);
}

// Init
window.addEventListener("DOMContentLoaded", () => {
  fetchProperties("", 1);
  initHeroSlideshow();
});
