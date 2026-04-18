require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { users, documents } = require("./storage");
const documentRoutes = require("./routes/documentRoutes");
const kycRoutes = require("./routes/kycRoutes");


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

// Mount Modular Routes
app.use("/api/documents", documentRoutes);
app.use("/api/kyc", kycRoutes);


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
  res.json({ token, user: { id: user.id, username: user.username } });
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

// ---------------- Legacy Upload (Refactored to use storage) ----------------
// Maintaining for compatibility if needed, but redirects to the logic in documentRoutes
app.post("/upload", authenticate, (req, res) => {
  // Logic is now primarily in /api/documents/upload, 
  // but we can proxy or redirect if existing frontend calls this.
  res.status(400).json({ message: "Please use /api/documents/upload" });
});

// ---------------- Share ----------------
const crypto = require("crypto");
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
    )}&token=${token}&exp=${expiresAt}`;

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
