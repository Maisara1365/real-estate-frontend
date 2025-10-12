function updateNav() {
  const nav = document.getElementById("nav-links");
  if (!nav) return; // safety check
  nav.innerHTML = ""; // clear old items

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    // Guest
    nav.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="login.html">Login</a></li>
      <li><a href="signup.html">Register</a></li>
    `;
  } else if (user.user_type === "buyer") {
    // Buyer
    nav.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="message.html">Messages</a></li>
      <li><a href="#" onclick="logout()">Logout</a></li>
    `;
  } else if (user.user_type === "seller") {
    // Seller
    nav.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="message.html">Messages</a></li>
      <li class="dropdown">
        <a href="#" class="dropdown-toggle">Properties <span class="arrow">▾</span></a>
        <ul class="dropdown-menu">
          <li><a href="myProperties.html">My Properties</a></li>
          <li><a href="addProperty.html">Add Property</a></li>
        </ul>
      </li>
      <li><a href="#" onclick="logout()">Logout</a></li>
    `;
  } else if (user.user_type === "admin") {
    // Admin
    nav.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="message.html">Messages</a></li>
      <li><a href="admin.html">Admin Dashboard</a></li>
      <li><a href="#" onclick="logout()">Logout</a></li>
    `;
  }

  highlightActiveLink();
  setupDropdownToggle();
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.setItem("forceLogin", "true");
  window.location.href = "login.html";
}

function highlightActiveLink() {
  const links = document.querySelectorAll("nav ul li a");
  let current = window.location.pathname.split("/").pop();

  // Handle homepage case on Render ("/" should match "index.html")
  if (current === "" || current === "/") {
    current = "index.html";
  }

  links.forEach(link => {
    const href = link.getAttribute("href");
    if (href === current) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function setupDropdownToggle() {
  const dropdown = document.querySelector(".dropdown");
  if (!dropdown) return;

  const toggle = dropdown.querySelector(".dropdown-toggle");
  const menu = dropdown.querySelector(".dropdown-menu");
  const arrow = dropdown.querySelector(".arrow");

  toggle.addEventListener("click", function (e) {
    e.preventDefault();
    menu.classList.toggle("show");
    arrow.classList.toggle("rotate");
  });

  document.addEventListener("click", function (e) {
    if (!dropdown.contains(e.target)) {
      menu.classList.remove("show");
      arrow.classList.remove("rotate");
    }
  });
}

document.addEventListener("DOMContentLoaded", updateNav);
