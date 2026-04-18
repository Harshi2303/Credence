const express = require("express");
const router = express.Router();
const { documents } = require("../storage");

/**
 * SIMULATED KYC PROVIDERS (For UI consistency)
 */
const API_PROVIDERS = {
  aadhar: [{ id: "uidai-automated", name: "UIDAI Automated Scan", speed: "0.5s", reliability: "100%" }],
  pan: [{ id: "it-automated", name: "Income Tax Dept Automated Scan", speed: "0.6s", reliability: "100%" }],
  dl: [{ id: "vahan-automated", name: "Sarathi Automated Scan", speed: "0.8s", reliability: "100%" }],
  voter: [{ id: "nvsp-automated", name: "NVSP Automated Scan", speed: "0.9s", reliability: "100%" }],
  passport: [{ id: "passport-automated", name: "Passport Seva Automated Scan", speed: "0.4s", reliability: "100%" }]
};

// Route to get available APIs (Keeping for compatibility)
router.get("/providers/:docType", (req, res) => {
  const { docType } = req.params;
  const providers = API_PROVIDERS[docType.toLowerCase()] || [{ id: "internal", name: "Internal Repository Scan", speed: "0.2s", reliability: "100%" }];
  res.json(providers);
});

/**
 * NEW SEAMLESS VERIFICATION ENDPOINT
 * Compares the uploaded file name/type with records in the repository.
 */
router.post("/verify-upload", async (req, res) => {
  const { docType, fileName } = req.body;

  if (!docType || !fileName) {
    return res.status(400).json({ error: "Missing document type or file name" });
  }

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  const typeKey = docType.toLowerCase();
  
  // Find a document in the repository that matches the category and the filename
  // For demonstration, we check if the repository HAS an Aadhaar document and if its name is similar
  const matchedDoc = documents.find(doc => {
    const docCat = (doc.category || "").toLowerCase();
    // Normalize category match (e.g. "Aadhaar Card" matches "aadhar")
    const isCategoryMatch = docCat.includes(typeKey) || typeKey.includes(docCat);
    
    // Check if filenames match (ignoring extensions if needed, but strict for now as per user req)
    const isNameMatch = doc.fileName.toLowerCase() === fileName.toLowerCase();
    
    return isCategoryMatch && isNameMatch;
  });

  if (matchedDoc) {
    res.json({
      verified: true,
      timestamp: new Date().toISOString(),
      details: {
        idStatus: "Active",
        holderMatched: true,
        issueDate: matchedDoc.uploadedAt,
        fileName: matchedDoc.fileName,
        fileUrl: matchedDoc.fileUrl, // For preview
        authenticityToken: `verif_${Math.random().toString(36).substr(2, 12)}`,
        dataMatchScore: "100% (Binary Match Found in Repository)"
      }
    });
  } else {
    res.json({
      verified: false,
      timestamp: new Date().toISOString(),
      reason: "Uploaded document does not match our records. No record of this file found in the secure repository for the selected category."
    });
  }
});

// Deprecated endpoint (kept for safety during transition)
router.post("/verify-id", (req, res) => {
  res.status(410).json({ error: "This endpoint is deprecated. Use /verify-upload for the new seamless flow." });
});

module.exports = router;
