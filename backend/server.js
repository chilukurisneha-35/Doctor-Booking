const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// =======================
// CORS Configuration
// =======================
const allowedOrigins = [
  "https://doctor-booking-peach.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

// =======================
// Middleware
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads only in local development
if (process.env.NODE_ENV !== "production") {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
}

// =======================
// Routes
// =======================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/patients", require("./routes/patients"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/admins", require("./routes/admins"));

// Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Book a Doctor Backend is Running 🚀",
  });
});

// Health Route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Book a Doctor API is active and healthy.",
  });
});

// =======================
// Seed Admin
// =======================
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (!adminExists) {
      const seedEmail = process.env.ADMIN_SEED_EMAIL;
      const seedPassword = process.env.ADMIN_SEED_PASSWORD;

      if (!seedEmail || !seedPassword) {
        console.warn(
          "Skipping admin seed: ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD not found."
        );
        return;
      }

      await User.create({
        name: "System Admin",
        email: seedEmail,
        password: seedPassword,
        role: "admin",
      });

      console.log(`Admin account seeded successfully (${seedEmail})`);
    }
  } catch (error) {
    console.error("Seed Admin Error:", error);
  }
};

seedAdmin();

// =======================
// Error Handler
// =======================
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

// Start server locally only
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
