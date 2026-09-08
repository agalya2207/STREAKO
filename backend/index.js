const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount central API routes
app.use('/api', routes);

// Centralized error handling
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`STREAKO Backend API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
