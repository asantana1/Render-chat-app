const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt'); // For hashing passwords
const bodyParser = require('body-parser');

const app = express();

// Body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// For unauthenticated users (based on IP)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs

  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers

  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many messages sent. Please wait a minute before trying again.'
    });
  }
});

app.set('trust proxy', 1);

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// ROUTES
// ============================================

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`📧 Email configured for: ${process.env.SMTP_USER}`);
});
