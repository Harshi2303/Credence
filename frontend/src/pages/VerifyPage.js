import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Alert,
} from "@mui/material";

// Icons
import BadgeIcon from "@mui/icons-material/Badge";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import DriveEtaIcon from "@mui/icons-material/DriveEta";
import PublicIcon from "@mui/icons-material/Public";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArticleIcon from "@mui/icons-material/Article";

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

function VerifyPage({ onBack }) {
  const [stage, setStage] = useState(STAGES.CHOOSING);
  const [selectedType, setSelectedType] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (stage === STAGES.CHOOSING) {
      if (onBack) onBack();
    } else if (stage === STAGES.UPLOADING) {
      setStage(STAGES.CHOOSING);
      setSelectedType(null);
      setUploadFile(null);
    } else if (stage === STAGES.RESULT) {
      setStage(STAGES.CHOOSING);
      setVerificationResult(null);
      setSelectedType(null);
      setUploadFile(null);
    }
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setStage(STAGES.UPLOADING);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const runVerification = async () => {
    if (!uploadFile || !selectedType) return;
    
    setLoading(true);
    setStage(STAGES.PROCESSING);

    try {
      const response = await axios.post("http://localhost:5000/api/kyc/verify-upload", {
        docType: selectedType.id,
        fileName: uploadFile.name
      });
      setVerificationResult(response.data);
    } catch (error) {
      setVerificationResult({
        verified: false,
        reason: "Communication error with verification registry. Please try again."
      });
    } finally {
      setLoading(false);
      setStage(STAGES.RESULT);
    }
  };

  // --- RENDERING PHASES ---

  const renderSelection = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" fontWeight="900" gutterBottom align="center" sx={{ mb: 4, color: "#1a1a1a" }}>
        Select Document to Verify
      </Typography>
      <Grid container spacing={3}>
        {DOC_TYPES.map((type) => (
          <Grid item xs={12} sm={6} md={4} key={type.id}>
            <Card 
              sx={{ 
                borderRadius: 5, 
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.05)",
                "&:hover": { 
                  transform: "translateY(-8px)", 
                  boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                  borderColor: type.color
                }
              }}
            >
              <CardActionArea onClick={() => handleSelectType(type)} sx={{ p: 5, textAlign: "center" }}>
                <Box sx={{ color: type.color, mb: 2, display: "flex", justifyContent: "center" }}>{type.icon}</Box>
                <Typography variant="h6" fontWeight="800">{type.name}</Typography>
                <Typography variant="body2" color="text.secondary">Direct Verification Flow</Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderUpload = () => (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2, bgcolor: "rgba(0,0,0,0.05)" }}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" fontWeight="900">Upload {selectedType.name}</Typography>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          p: 6, 
          borderRadius: 6, 
          textAlign: "center", 
          border: "2px dashed #ccc",
          bgcolor: "#fcfcfc",
          transition: "all 0.3s ease",
          "&:hover": { bgcolor: "#f5f5f5", borderColor: selectedType.color }
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 70, color: selectedType.color, mb: 3, opacity: 0.7 }} />
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {uploadFile ? uploadFile.name : `Select ${selectedType.name} File`}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Support for JPG, PNG, or PDF formats (Max 5MB)
        </Typography>

        <Button
          variant="contained"
          component="label"
          size="large"
          sx={{ 
            px: 4, py: 2, 
            borderRadius: 3, 
            bgcolor: selectedType.color,
            "&:hover": { bgcolor: selectedType.color, opacity: 0.9 }
          }}
        >
          {uploadFile ? "Change File" : `Upload ${selectedType.name}`}
          <input type="file" hidden onChange={handleFileChange} accept="image/*,.pdf" />
        </Button>

        {uploadFile && (
          <Box sx={{ mt: 5 }}>
            <Button 
              fullWidth 
              variant="contained" 
              size="large"
              color="primary"
              onClick={runVerification}
              sx={{ py: 2, borderRadius: 3, fontWeight: "bold", fontSize: "1.1rem" }}
            >
              VERIFY DOCUMENT
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );

  const renderProcessing = () => (
    <Box sx={{ textAlign: "center", py: 10 }}>
      <CircularProgress size={80} thickness={4} sx={{ mb: 4, color: selectedType.color }} />
      <Typography variant="h5" fontWeight="bold" gutterBottom>Authenticating Document...</Typography>
      <Typography variant="body1" color="text.secondary">
        Verifying integrity with secure registry records
      </Typography>
    </Box>
  );

  const renderResult = () => {
    const isVerified = verificationResult?.verified;

    return (
      <Fade in={true} timeout={1000}>
        <Box sx={{ maxWidth: 700, mx: "auto" }}>
          <Paper 
            sx={{ 
              p: 6, 
              borderRadius: 8, 
              textAlign: "center",
              boxShadow: "0 30px 60px rgba(0,0,0,0.1)",
              borderTop: `10px solid ${isVerified ? "#4caf50" : "#f44336"}`
            }}
          >
            {isVerified ? (
              <Box>
                <CheckCircleIcon sx={{ fontSize: 100, color: "#4caf50", mb: 3 }} />
                <Typography variant="h4" fontWeight="900" color="success.main" gutterBottom>
                  {selectedType.name} Verified Successfully
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={5}>
                  The uploaded document has been authenticated against the official repository.
                </Typography>

                <Alert icon={<ArticleIcon />} severity="success" sx={{ mb: 4, borderRadius: 3, textAlign: "left" }}>
                  <strong>Document Preview Available</strong> - File matched in Internal Registry
                </Alert>

                {/* DOCUMENT PREVIEW SIMULATION */}
                <Box 
                  sx={{ 
                    borderRadius: 4, 
                    overflow: "hidden", 
                    border: "1px solid #eee", 
                    mb: 4,
                    bgcolor: "#f9f9f9",
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}
                >
                  <ArticleIcon sx={{ fontSize: 100, color: "#999", mb: 2 }} />
                  <Typography variant="subtitle1" fontWeight="bold">{verificationResult.details.fileName}</Typography>
                  <Typography variant="caption" color="text.secondary">Type: {selectedType.name} (Authentic Copy)</Typography>
                  <Chip 
                    label="CERTIFIED" 
                    color="success" 
                    size="small" 
                    sx={{ mt: 2, fontWeight: "bold" }} 
                  />
                </Box>

                <Button 
                  fullWidth 
                  variant="outlined" 
                  size="large" 
                  onClick={handleBack}
                  sx={{ py: 2, borderRadius: 3 }}
                >
                  Return to Dashboard
                </Button>
              </Box>
            ) : (
              <Box>
                <ErrorOutlineIcon sx={{ fontSize: 100, color: "#f44336", mb: 3 }} />
                <Typography variant="h4" fontWeight="900" color="error.main" gutterBottom>
                  Verification Failed
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>
                  {verificationResult.reason}
                </Typography>
                <Button 
                  variant="contained" 
                  color="error" 
                  size="large" 
                  onClick={handleBack}
                  sx={{ px: 6, py: 2, borderRadius: 3 }}
                >
                  Try Again
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </Fade>
    );
  };

  return (
    <Box sx={{ py: 4, maxWidth: 1000, mx: "auto" }}>
      {stage === STAGES.CHOOSING && (
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={onBack} sx={{ bgcolor: "#eee" }}><ArrowBackIcon /></IconButton>
            <Typography variant="h4" fontWeight="900" sx={{ color: "#2575fc" }}>Verify IDs</Typography>
          </Box>
          <Chip label="Security Scan KYC" color="primary" variant="outlined" sx={{ fontWeight: "bold" }} />
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
