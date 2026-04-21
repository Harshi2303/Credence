import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Fade,
  Grid,
  Card,
  CardActionArea,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";

// Icons
import BadgeIcon from "@mui/icons-material/Badge";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import DriveEtaIcon from "@mui/icons-material/DriveEta";
import PublicIcon from "@mui/icons-material/Public";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FolderSharedIcon from "@mui/icons-material/FolderShared";

const DOC_TYPES = [
  { id: "aadhar", name: "Aadhaar Card", icon: <BadgeIcon sx={{ fontSize: 45 }} />, color: "#2575fc" },
  { id: "pan", name: "PAN Card", icon: <CreditCardIcon sx={{ fontSize: 45 }} />, color: "#6a11cb" },
  { id: "voter", name: "Voter ID", icon: <HowToVoteIcon sx={{ fontSize: 45 }} />, color: "#ff4b2b" },
  { id: "dl", name: "Driving License", icon: <DriveEtaIcon sx={{ fontSize: 45 }} />, color: "#20bf6b" },
  { id: "passport", name: "Passport", icon: <PublicIcon sx={{ fontSize: 45 }} />, color: "#4b6cb7" },
];

const STAGES = {
  CHOOSING: "choosing",
  UPLOADING: "uploading",
  PROCESSING: "processing",
  RESULT: "result"
};

const safeReadDocs = () => {
  const raw = localStorage.getItem("credence_documents");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const extractKYCData = (text, docType) => {
    const data = {};
    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    const cleanText = text.replace(/\n/g, ' ');

    let extractedDOB = "Not found";
    
    // Absolute Catch-All Date Hunt without Boundaries
    const possibleDates = cleanText.match(/[0-3]?[0-9][/.-][0-1]?[0-9][/.-](?:19|20)\d{2}/g);
    if (possibleDates && possibleDates.length > 0) {
        let oldestDateStr = possibleDates[0];
        let oldestYear = 9999;
        
        possibleDates.forEach(d => {
             const parts = d.trim().includes('-') ? d.trim().split('-') : d.trim().includes('/') ? d.trim().split('/') : d.trim().split('.');
             if (parts.length >= 3) {
                 const currentY = parseInt(parts[2], 10);
                 if (currentY >= 1900 && currentY <= new Date().getFullYear()) {
                     if (currentY < oldestYear) {
                         oldestYear = currentY;
                         oldestDateStr = d.trim();
                     }
                 }
             }
        });
        if (oldestYear !== 9999) extractedDOB = oldestDateStr;
    }
    
    data["Date of Birth / Issue"] = extractedDOB !== "Not found" ? extractedDOB : "Unreadable in image";

    if (docType === "pan") {
        const panMatch = cleanText.match(/[A-Z]{5}[0-9O]{4}[A-Z]{1}/i);
        data["PAN Number"] = panMatch ? panMatch[0].toUpperCase().replace(/O/g, '0') : "Unreadable in image";
    } else if (docType === "aadhar") {
        const aadhaarMatch = cleanText.match(/\d{4}[\s-]?\d{4}[\s-]?\d{4}/);
        data["Aadhaar Number"] = aadhaarMatch ? aadhaarMatch[0] : "Unreadable in image";
    } else if (docType === "voter") {
        const epicMatch = cleanText.match(/[A-Z]{3}[\s-]*[0-9O]{7}/i);
        data["EPIC Number"] = epicMatch ? epicMatch[0].toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0') : "Unreadable in image";
    } else if (docType === "dl") {
        let extractedDl = "Unreadable in image";
        const dlScan = cleanText.match(/(?:TN|DL|MH|KA|AP|UP|HR|RJ|KL|PB|WB|BR)([A-Z0-9\s-]{12,18})/i) || cleanText.match(/[A-Z]{2}[A-Z0-9\s-]{12,18}/i) || cleanText.match(/\b[A-Z0-9]{15,16}\b/i);
        if (dlScan) {
             const cleanedStr = dlScan[0].replace(/[\s-]/g, '');
             if (cleanedStr.length >= 10 && cleanedStr.length <= 16) {
                 extractedDl = cleanedStr;
             }
        }
        data["License Number"] = extractedDl.toUpperCase().replace(/O/g, '0');
    } else if (docType === "passport") {
        const passMatch = cleanText.match(/[A-Z]{1}[0-9O]{7}/i);
        data["Passport Number"] = passMatch ? passMatch[0].toUpperCase().replace(/O/g, '0') : "Unreadable in image";
    }

    let bestName = "";
    let highestScore = 0;
    
    for (let l of rawLines) {
        let cleanLine = l.replace(/(Name|Nane|elector's name|Father's name|S\/W\/D)[\s:]*/gi, '').trim();
        cleanLine = cleanLine.replace(/[^a-zA-Z\s.]/g, '').trim();
        
        if (cleanLine.length >= 4 && cleanLine.length <= 40) {
            let score = 0;
            const words = cleanLine.split(/\s+/);
            
            let capitals = 0;
            words.forEach(w => {
                 if (/^[A-Z]/.test(w)) capitals++;
            });
            score += (capitals / words.length) * 10;
            
            if (/^[a-z]/.test(cleanLine)) score -= 15;
            
            const badWords = ["government", "india", "authority", "license", "father", "blood", "group", "dob", "date", "address", "school", "north", "south", "eula", "union", "panchayat", "constituency", "vid", "hib", "male", "female", "download", "issue"];
            const lowerLine = cleanLine.toLowerCase();
            badWords.forEach(bw => {
                if (lowerLine.includes(bw)) score -= 30;
            });

            if (score > highestScore && score >= 5) {
                highestScore = score;
                bestName = cleanLine;
            }
        }
    }

    if (bestName) {
        data["Name"] = bestName;
    } else {
        data["Name"] = "Could not cleanly map from photo";
    }

    data["OCR Extraction Status"] = "Extraction Successful";
    return data;
};

const MenuProps = {
  PaperProps: {
    style: {
      backgroundColor: 'rgba(15, 10, 25, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
    },
  },
};

function VerifyPage({ onBack }) {
  const [stage, setStage] = useState(STAGES.CHOOSING);
  const [selectedType, setSelectedType] = useState(null);
  
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedVaultDocId, setSelectedVaultDocId] = useState("");
  
  const [vaultDocs, setVaultDocs] = useState([]);
  
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVaultDocs(safeReadDocs());
  }, []);

  const handleBack = () => {
    if (stage === STAGES.CHOOSING) {
      if (onBack) onBack();
    } else if (stage === STAGES.UPLOADING) {
      setStage(STAGES.CHOOSING);
      setSelectedType(null);
      setUploadFile(null);
      setSelectedVaultDocId("");
    } else if (stage === STAGES.RESULT) {
      setStage(STAGES.CHOOSING);
      setVerificationResult(null);
      setSelectedType(null);
      setUploadFile(null);
      setSelectedVaultDocId("");
    }
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setStage(STAGES.UPLOADING);
  };

  const runVerification = async () => {
    const hasSource = uploadFile || selectedVaultDocId;
    if (!hasSource || !selectedType) return;
    
    setLoading(true);
    setStage(STAGES.PROCESSING);

    let docDetails = {};
    let fileToRead = null;

    if (uploadFile) {
        docDetails = {
           fileName: uploadFile.name,
           source: "Local Upload",
           date: new Date().toISOString()
        };
        fileToRead = uploadFile;
    } else {
        const doc = vaultDocs.find(d => d.id === selectedVaultDocId);
        docDetails = {
           fileName: doc?.fileName || doc?.displayName || "Unknown",
           source: "Vault Document",
           date: doc?.createdAt || new Date().toISOString()
        };
        fileToRead = doc?.fileDataUrl;
    }
    
    let extractedData = {};

    try {
        if (!fileToRead) throw new Error("No readable file found.");
        
        const result = await Tesseract.recognize(
          fileToRead,
          'eng',
          { logger: m => console.log("OCR progress:", m.status, Math.round(m.progress * 100) + "%") }
        );
        
        extractedData = extractKYCData(result.data.text, selectedType.id);

    } catch (err) {
        console.error("OCR Error:", err);
        extractedData = { 
            "Error": "Failed to extract text.",
            "OCR Extraction Status": "Failed"
        };
    }

    setVerificationResult({
      verified: true,
      details: docDetails,
      extractedData: extractedData
    });

    setLoading(false);
    setStage(STAGES.RESULT);
  };

  const renderSelection = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" fontWeight="900" gutterBottom align="center" sx={{ mb: 4, color: "#fff", fontFamily: '"Space Grotesk", sans-serif', textTransform: "uppercase", letterSpacing: 1 }}>
        Select Document for OCR Extraction
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 3 }}>
        {DOC_TYPES.map((type) => (
            <Card 
              key={type.id}
              sx={{ 
                width: 170,
                borderRadius: 5, 
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(15, 10, 25, 0.65)",
                backdropFilter: "blur(20px)",
                color: "#fff",
                "&:hover": { 
                  transform: "translateY(-8px)", 
                  boxShadow: `0 20px 40px -10px ${type.color}40`,
                  borderColor: type.color,
                  background: "rgba(15, 10, 25, 0.95)",
                }
              }}
            >
              <CardActionArea onClick={() => handleSelectType(type)} sx={{ p: 3, textAlign: "center", height: "100%" }}>
                <Box sx={{ color: type.color, mb: 2, display: "flex", justifyContent: "center" }}>{type.icon}</Box>
                <Typography variant="body1" fontWeight="800" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 0.5 }}>{type.name}</Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", lineHeight: 1.2 }}>Detailed Data Reading</Typography>
              </CardActionArea>
            </Card>
        ))}
      </Box>
    </Box>
  );

  const renderUpload = () => {
    const relevantDocs = vaultDocs.filter(d => {
       const cat = (d.category || "").toLowerCase();
       const sName = selectedType.name.toLowerCase();
       if (cat.includes(sName) || sName.includes(cat)) return true;
       if (selectedType.id === "aadhar" && cat.includes("aadhar")) return true;
       if (selectedType.id === "pan" && cat.includes("pan")) return true;
       if (selectedType.id === "voter" && cat.includes("voter")) return true;
       if (selectedType.id === "dl" && cat.includes("driving")) return true;
       if (selectedType.id === "passport" && cat.includes("passport")) return true;
       return false;
    });

    return (
      <Box sx={{ maxWidth: 800, mx: "auto", color: "#fff" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2, bgcolor: "rgba(255,255,255,0.05)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}><ArrowBackIcon /></IconButton>
          <Typography variant="h4" fontWeight="900" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>OCR Scan: {selectedType.name}</Typography>
        </Box>

        <Grid container spacing={4}>
           <Grid item xs={12} md={6}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, borderRadius: 6, textAlign: "center", border: "2px dashed rgba(255,255,255,0.2)",
                  bgcolor: "rgba(15, 10, 25, 0.65)", backdropFilter: "blur(20px)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
                  transition: "all 0.3s ease", "&:hover": { bgcolor: "rgba(15, 10, 25, 0.95)", borderColor: selectedType.color }, color: "#fff"
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 60, color: selectedType.color, mb: 2, mx: "auto", opacity: 0.9 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>Upload New File</Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>From your computer/device</Typography>
                
                <Button variant="contained" component="label" disableElevation sx={{ bgcolor: selectedType.color, mb: 2, "&:hover": { bgcolor: selectedType.color, opacity: 0.9 } }}>
                  {uploadFile ? "Change File" : "Choose File"}
                  <input type="file" hidden onChange={(e) => {
                    if(e.target.files && e.target.files[0]) {
                       setUploadFile(e.target.files[0]);
                       setSelectedVaultDocId(""); 
                    }
                  }} accept="image/*,.pdf" />
                </Button>
                {uploadFile && <Typography variant="caption" color="success.main" fontWeight="bold">Selected: {uploadFile.name}</Typography>}
              </Paper>
           </Grid>

           <Grid item xs={12} md={6}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, borderRadius: 6, textAlign: "center", border: "1px solid rgba(255,255,255,0.1)",
                  bgcolor: "rgba(15, 10, 25, 0.65)", backdropFilter: "blur(20px)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
                  transition: "all 0.3s ease", "&:hover": { bgcolor: "rgba(15, 10, 25, 0.95)", borderColor: selectedType.color }, color: "#fff"
                }}
              >
                <FolderSharedIcon sx={{ fontSize: 60, color: selectedType.color, mb: 2, mx: "auto", opacity: 0.9 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>Select From Vault</Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>Use your trusted digital vault</Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="vault-select-label" sx={{ color: "#94a3b8" }}>Select Document</InputLabel>
                  <Select
                    labelId="vault-select-label"
                    value={selectedVaultDocId}
                    label="Select Document"
                    MenuProps={MenuProps}
                    sx={{ color: "#fff", textAlign: "left", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: selectedType.color }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: selectedType.color } }}
                    onChange={(e) => {
                       setSelectedVaultDocId(e.target.value);
                       setUploadFile(null); 
                    }}
                    disabled={relevantDocs.length === 0}
                  >
                    {relevantDocs.length === 0 ? (
                      <MenuItem value="" disabled>No matches found in Vault</MenuItem>
                    ) : (
                      relevantDocs.map(d => (
                        <MenuItem key={d.id} value={d.id}>{d.displayName || d.fileName}</MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                {selectedVaultDocId && <Typography variant="caption" color="success.main" fontWeight="bold">Vault Document Assigned</Typography>}
              </Paper>
           </Grid>
        </Grid>
        
        <Box sx={{ mt: 5, textAlign: "center" }}>
          <Button 
            variant="contained" 
            size="large"
            color="primary"
            onClick={runVerification}
            disabled={(!uploadFile && !selectedVaultDocId) || loading}
            sx={{ py: 2, px: 8, borderRadius: 3, fontWeight: "bold", fontSize: "1.1rem", transition: "transform 0.2s", "&:active": { transform: "scale(0.98)" } }}
          >
            {loading ? "SCANNING..." : "PERFORM OCR SCAN"}
          </Button>
        </Box>
      </Box>
    );
  };

  const renderProcessing = () => (
    <Box sx={{ textAlign: "center", py: 10 }}>
      <CircularProgress size={80} thickness={4} sx={{ mb: 4, color: selectedType.color }} />
      <Typography variant="h5" fontWeight="bold" gutterBottom>Scanning Document Contents...</Typography>
      <Typography variant="body1" color="text.secondary">
        Extracting text components via Optical Character Recognition
      </Typography>
    </Box>
  );

  const renderResult = () => {
    const data = verificationResult?.extractedData || {};
    
    return (
      <Fade in={true} timeout={1000}>
        <Box sx={{ maxWidth: 700, mx: "auto" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <IconButton onClick={handleBack} sx={{ mr: 2, bgcolor: "rgba(0,0,0,0.05)" }}><ArrowBackIcon /></IconButton>
            <Typography variant="h5" fontWeight="900">OCR Scan Results</Typography>
          </Box>

          <Paper 
            className="glass-panel"
            sx={{ 
              p: 6, borderRadius: 8, textAlign: "center",
              boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
              borderTop: `10px solid #10b981`,
              backgroundColor: "rgba(10, 5, 20, 0.95)",
              color: "#fff"
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 80, color: "#10b981", mb: 2, filter: "drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))" }} />
            <Typography variant="h3" fontWeight="900" sx={{ color: "#10b981", mb: 1, fontFamily: '"Space Grotesk", sans-serif' }}>
              OCR COMPLETED
            </Typography>
            <Typography variant="body1" sx={{ color: "#94a3b8", mb: 4 }}>
            </Typography>

            <Box 
              sx={{ 
                borderRadius: 4, overflow: "hidden", border: "1px solid rgba(16, 185, 129, 0.3)", 
                mb: 4, background: "linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(0,0,0,0.4) 100%)", p: 4, textAlign: "left",
                color: "#e2e8f0"
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, borderBottom: "1px solid #ddd", pb: 1 }}>
                Extracted Document Data (OCR)
              </Typography>
              <Grid container spacing={3}>
                 {Object.entries(data).map(([k, v]) => (
                    <Grid item xs={12} sm={6} key={k}>
                       <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontWeight: 700, textTransform: "uppercase", mb: 0.5 }}>{k}</Typography>
                       <Typography variant="body1" fontWeight="bold" sx={{ fontSize: "1.1rem", color: "#fff" }}>{v}</Typography>
                    </Grid>
                 ))}
                 
                 <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                 </Grid>
                 
                 <Grid item xs={12} sm={6}>
                     <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontWeight: 700, textTransform: "uppercase", mb: 0.5 }}>File Processed</Typography>
                     <Typography variant="body2" sx={{ color: "#fff" }}>{verificationResult?.details?.fileName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                     <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", fontWeight: 700, textTransform: "uppercase", mb: 0.5 }}>Document Source</Typography>
                     <Chip size="small" label={verificationResult?.details?.source} sx={{ mt: 0.5, color: "#8b5cf6", borderColor: "#8b5cf6", fontWeight: "bold" }} variant="outlined" />
                  </Grid>
              </Grid>
            </Box>

            <Button 
              fullWidth 
              variant="contained" 
              size="large" 
              onClick={handleBack}
              sx={{ 
                py: 2, 
                borderRadius: 3, 
                fontWeight: "bold",
                background: "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)",
                "&:hover": { background: "linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)" }
              }}
            >
              Scan Another Document
            </Button>
          </Paper>
        </Box>
      </Fade>
    );
  };

  return (
    <Box sx={{ py: 4, maxWidth: 1000, mx: "auto" }}>
      {stage === STAGES.CHOOSING && (
        <Box sx={{ mb: 6, display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", pb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <IconButton 
              onClick={onBack} 
              sx={{ 
                bgcolor: "rgba(255,255,255,0.05)", 
                border: "1px solid rgba(255,255,255,0.1)", 
                color: "#fff",
                p: 1.5,
                "&:hover": { bgcolor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" } 
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h2" className="gradient-text" sx={{ letterSpacing: 2, fontSize: { xs: "1.8rem", md: "2.4rem" } }}>
                READER // OCR
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.2, letterSpacing: 1.5, fontWeight: 700, fontSize: "0.7rem", opacity: 0.8 }}>
                SECURE OPTICAL CHARACTER RECOGNITION PIPELINE // ENCRYPTED
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", bgcolor: "rgba(0,0,0,0.3)", px: 2, py: 1, borderRadius: 2, border: "1px solid rgba(255,255,255,0.05)" }}>
             <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981", boxShadow: "0 0 10px #10b981" }} />
             <Typography variant="caption" sx={{ color: "#fff", fontWeight: 800, letterSpacing: 1 }}>ACTIVE</Typography>
          </Box>
        </Box>
      )}

      {stage === STAGES.CHOOSING && renderSelection()}
      {stage === STAGES.UPLOADING && renderUpload()}
      {stage === STAGES.PROCESSING && renderProcessing()}
      {stage === STAGES.RESULT && renderResult()}
    </Box>
  );
}

export default VerifyPage;
