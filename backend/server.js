const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads folder static serving path
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/admins', require('./routes/admins'));

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Book a Doctor API is active and healthy.' });
});

// Create seed account for Admin (if doesn't exist)
const User = require('./models/User');
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const seedEmail = process.env.ADMIN_SEED_EMAIL;
      const seedPassword = process.env.ADMIN_SEED_PASSWORD;

      if (!seedEmail || !seedPassword) {
        console.warn(
          'Skipping admin seed: set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in your .env to create the initial admin account.'
        );
        return;
      }

      await User.create({
        name: 'System Admin',
        email: seedEmail,
        password: seedPassword, // Will be hashed pre-save
        role: 'admin',
      });
      console.log(`Admin account seeded successfully (${seedEmail})`);
    }
  } catch (error) {
    console.error('Seed Admin error:', error);
  }
};
seedAdmin();

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server occurred an error: ' + err.message });
});

const PORT = process.env.PORT || 5000;

// Start server only when running locally
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
    );
  });
}

// Export the Express app for Vercel
module.exports = app;
