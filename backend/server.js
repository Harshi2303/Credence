const express = require("express");

const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const JWT_SECRET = "your_super_secret_key";

// Mock database
const users = [];
const documents = [];

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------- Signup ----------------
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const existing = users.find((u) => u.username === username);
  if (existing) return res.status(400).json({ message: "Username exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, username, email, passwordHash };
  users.push(newUser);

  res.json({ message: "Signup successful" });
});

// ---------------- Login ----------------
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(400).json({ message: "Invalid username/password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(400).json({ message: "Invalid username/password" });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

// Middleware to verify token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ---------------- Upload ----------------
app.post("/upload", authenticate, upload.single("document"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

  // Save in documents array
  documents.push({
    userId: req.userId,
    filename: req.file.originalname,
    hash,
    uploadedAt: new Date(),
  });

  // Do NOT send hash to user
  res.json({ message: "File uploaded and hash stored securely" });
});

// ---------------- Share ----------------
app.post("/api/share", (req, res) => {
  try {
    const { cid, hash, docId, owner } = req.body || {};
    if (!cid && !hash) {
      return res.status(400).json({ error: "Missing document reference for sharing." });
    }

    const token = crypto.randomBytes(8).toString("hex");
    const expiresAt = Date.now() + 30 * 60 * 1000;
    const shareUrl = `http://localhost:3000/shared?doc=${encodeURIComponent(
      docId || hash || cid
    )}&cid=${encodeURIComponent(cid || "")}&owner=${encodeURIComponent(owner || "")}&token=${token}&exp=${expiresAt}`;

    return res.status(200).json({
      shareUrl,
      expiresAt,
      message: "Share link generated",
    });
  } catch (error) {
    console.error("Share route failed:", error);
    return res.status(503).json({ error: "Sharing service temporarily unavailable" });
  }
});

// Global safety net: avoid empty responses on uncaught route errors
app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);
  if (res.headersSent) {
    return next(error);
  }
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
