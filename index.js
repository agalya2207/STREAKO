const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root health-check route
app.get('/', (req, res) => {
  res.json({ message: 'Streako Backend is Running! ✓' });
});

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Only listen if run directly (local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless deployment
module.exports = app;