// auth.js — Authentication script for live backend

// Toggle password visibility
function togglePassword(id) {
  const input = document.getElementById(id);
  if (input) {
    input.type = input.type === "password" ? "text" : "password";
  }
}

// Live backend URL
const AUTH_API = "https://real-estate-backend-1-s7p3.onrender.com/api/auth";

// Handle login
async function login(event) {
  event.preventDefault();

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    const normalizedUser = {
      id: data.user?.user_id || data.user?.id,
      user_type: (data.user?.user_type || data.user?.role || "").toLowerCase(),
      name:
        data.user?.name ||
        `${data.user?.first_name || ""} ${data.user?.last_name || ""}`.trim(),
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.removeItem("forceLogin");

    const redirectUrl = localStorage.getItem("redirectAfterLogin");
    if (redirectUrl) {
      localStorage.removeItem("redirectAfterLogin");
      window.location.href = redirectUrl;
    } else {
      window.location.href = "index.html"; // ✅ updated here
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong during login.");
  }
}

// Handle register
async function register(event) {
  event.preventDefault();

  const first_name = document.getElementById("first_name")?.value.trim();
  const last_name = document.getElementById("last_name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const confirmPassword = document.getElementById("confirmPassword")?.value.trim();
  const user_type = document.getElementById("user_type")?.value;

  if (!first_name || !last_name || !email || !password || !user_type) {
    alert("Please fill in all fields");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const res = await fetch(`${AUTH_API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name, last_name, email, password, user_type }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Registration failed");
      return;
    }

    alert("Registration successful! Please log in.");
    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    alert("Something went wrong during registration.");
  }
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.setItem("forceLogin", "true");
  window.location.href = "login.html";
}

// Redirect if already logged in
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  const forceLogin = localStorage.getItem("forceLogin");

  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", login);

  const signupForm = document.getElementById("signupForm");
  if (signupForm) signupForm.addEventListener("submit", register);

  if (token && user && !forceLogin) {
    if (
      window.location.pathname.includes("login") ||
      window.location.pathname.includes("signup")
    ) {
      window.location.href = "index.html"; // ✅ updated here
    }
  }
});

// Auth Page Slideshow
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".auth-slideshow .slide");
  const title = document.getElementById("overlayTitle");
  const subtitle = document.getElementById("overlaySubtitle");
  let index = 0;

  if (slides.length > 0) {
    setInterval(() => {
      slides[index].classList.remove("active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
      if (title && subtitle) {
        title.textContent = slides[index].dataset.title;
        subtitle.textContent = slides[index].dataset.subtitle;
      }
    }, 5000);
  }
});
