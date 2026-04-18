const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { documents } = require("../storage");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("document"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const hash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Check if document already exists
    const existing = documents.find(d => d.hash === hash);
    if (existing) {
       return res.json({
        message: "Document already exists",
        documentId: existing.id,
        documentHash: hash,
        uploadedAt: existing.uploadedAt,
        fileName: existing.fileName
      });
    }

    const { category } = req.body;

    const newDocument = {
      id: uuidv4(),
      hash,
      fileName: req.file.originalname,
      category: category || "Unknown",
      uploadedAt: new Date(),
      status: "Verified",
    };

    documents.push(newDocument);


    res.json({
      message: "Document uploaded successfully",
      documentId: newDocument.id,
      documentHash: hash,
      uploadedAt: newDocument.uploadedAt
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

router.post("/verify", (req, res) => {
  const { hash } = req.body;
  if (!hash) return res.status(400).json({ error: "Hash is required" });

  const document = documents.find((doc) => doc.hash === hash);

  if (document) {
    res.json({
      verified: true,
      document: document
    });
  } else {
    res.json({
      verified: false,
    });
  }
});

module.exports = router;
