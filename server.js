require('dotenv').config(); // loads variables from .env

const express = require('express');
const app = express();

// Middleware to read JSON request bodies
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.send('Real Estate App backend is running!');
});

// Start server using PORT from .env
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
