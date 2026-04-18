import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

function UploadPage({ token }) {
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSuccess(false);
    setHash("");
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("document", file);

    try {
      const res = await axios.post("http://localhost:5000/api/documents/upload", formData, {
        headers: { 
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "multipart/form-data" 
        },
      });
      setHash(res.data.documentHash);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleReset = () => {
    setFile(null);
    setHash("");
    setLoading(false);
    setSuccess(false);
  };

  const handleDownloadHash = () => {
    const blob = new Blob([hash], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${file ? file.name : "document"}_hash.txt`;
    link.click();
  };

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          padding: { xs: 3, sm: 5 },
          maxWidth: 600,
          width: "100%",
          textAlign: "center",
          borderRadius: 8,
          background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
          border: "1px solid #e0e6ed",
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: "#2575fc",
            marginBottom: 2,
            letterSpacing: "-0.5px"
          }}
        >
          Secure Upload
        </Typography>

        <Typography variant="subtitle1" sx={{ color: "#666", marginBottom: 4 }}>
          Your document will be hashed and stored in our secure verification registry.
        </Typography>

        {!success ? (
          <>
            <Box
              sx={{
                mb: 4,
                p: 4,
                border: "2px dashed #d1d9e6",
                borderRadius: 4,
                bgcolor: "#fcfdfe",
                cursor: "pointer",
                "&:hover": { borderColor: "#2575fc", bgcolor: "#f0f4ff" },
              }}
              component="label"
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: "#2575fc", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {file ? file.name : "Click to select or drag and drop"}
              </Typography>
              <input type="file" hidden onChange={handleFileChange} />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={loading || !file}
                sx={{
                  px: 6,
                  py: 1.5,
                  fontWeight: "bold",
                  borderRadius: 3,
                  background: "linear-gradient(90deg, #2575fc, #6a11cb)",
                }}
              >
                {loading ? "Processing..." : "Register Document"}
              </Button>

              <Tooltip title="Reset">
                <IconButton color="error" onClick={handleReset} disabled={loading}>
                  <RestartAltIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        ) : (
          <Fade in={true}>
            <Box sx={{ py: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: "#4caf50", mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" color="success.main" gutterBottom>
                Registration Successful!
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Your document's integrity signature has been generated and recorded.
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: "#f8f9fa",
                  borderRadius: 3,
                  wordBreak: "break-all"
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">SHA-256 HASH SIGNATURE</Typography>
                <Typography variant="body2" fontWeight="mono">{hash}</Typography>
              </Paper>

              <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadHash}
                >
                  Download Signature
                </Button>
                <Button variant="text" onClick={handleReset}>
                  Upload Another
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {loading && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="caption" sx={{ mt: 1, display: "block" }}>Encrypting and generating proofs...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: 3 }}>
            {error}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

const Fade = ({ children, in: isIn }) => (
  <div style={{ transition: "opacity 0.5s", opacity: isIn ? 1 : 0 }}>
    {children}
  </div>
);

export default UploadPage;
