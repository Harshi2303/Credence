const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

let documentStore = [];

router.post("/upload", upload.single("document"), (req, res) => {
  try {
    const fileBuffer = req.file.buffer;

    const hash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    const newDocument = {
      id: uuidv4(),
      hash,
      uploadedAt: new Date(),
    };

    documentStore.push(newDocument);

    res.json({
      message: "Document uploaded successfully",
      documentId: newDocument.id,
      documentHash: hash,
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

router.post("/verify", (req, res) => {
  const { hash } = req.body;

  const document = documentStore.find((doc) => doc.hash === hash);

  if (document) {
    res.json({
      verified: true,
      uploadedAt: document.uploadedAt,
    });
  } else {
    res.json({
      verified: false,
    });
  }
});

module.exports = router;
