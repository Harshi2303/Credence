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
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

function UploadPage({ token, onLogout }) {
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = () => {
    if (!file) return alert("Please select a file");
    setLoading(true);

    const formData = new FormData();
    formData.append("document", file);

    axios.post("http://localhost:5000/upload", formData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      // success message only
    })
    .catch((err) => console.error(err))
    .finally(() => setLoading(false));
        
  };
  
  const handleReset = () => {
    setFile(null);
    setHash("");
    setLoading(false);
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
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to right, #6a11cb, #2575fc)",
        padding: 2,
      }}
    >
      <Paper
        elevation={12}
        sx={{
          padding: { xs: 3, sm: 5 },
          maxWidth: 550,
          width: "100%",
          textAlign: "center",
          borderRadius: 4,
          background: "#f5f5ff",
          boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: "bold",
            color: "#2575fc",
            marginBottom: 3,
            textShadow: "1px 1px 2px #aaa",
          }}
        >
          Upload & Verify Document
        </Typography>

        <Typography variant="subtitle1" sx={{ color: "#555", marginBottom: 4 }}>
          Select a document to generate its secure SHA-256 hash and verify integrity.
        </Typography>

        {/* Upload Button */}
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{
            background: "linear-gradient(to right, #6a11cb, #2575fc)",
            color: "#fff",
            fontWeight: "bold",
            paddingX: 3,
            paddingY: 1.5,
            marginBottom: 2,
            borderRadius: 3,
            transition: "transform 0.2s",
            "&:hover": {
              background: "linear-gradient(to right, #2575fc, #6a11cb)",
              transform: "scale(1.05)",
            },
          }}
        >
          Select File
          <input type="file" hidden onChange={handleFileChange} />
        </Button>

        {file && (
          <Typography
            sx={{
              marginBottom: 3,
              fontWeight: "medium",
              color: "#333",
              wordBreak: "break-word",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            📄 {file.name}
          </Typography>
        )}

        {/* Upload & Reset Buttons */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleUpload}
            disabled={loading || !file}
            sx={{
              paddingX: 4,
              paddingY: 1.5,
              fontWeight: "bold",
              borderRadius: 3,
              transition: "transform 0.2s",
              "&:hover": { transform: "scale(1.05)" },
            }}
          >
            {loading ? "Uploading..." : "Upload"}
          </Button>

          <Tooltip title="Reset">
            <IconButton color="error" onClick={handleReset} sx={{ fontSize: 28 }}>
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {loading && <LinearProgress sx={{ marginBottom: 3, height: 6, borderRadius: 3 }} />}

        {/* Hash Display */}
        {hash && (
          <Paper
            elevation={4}
            sx={{
              marginTop: 3,
              padding: 3,
              wordBreak: "break-all",
              background: "#f0f4ff",
            }}
          >
            <Typography variant="h6" sx={{ color: "#6a11cb" }}>
              SHA-256 Hash
            </Typography>
            <Typography variant="body1" sx={{ marginY: 1, color: "#333" }}>
              {hash}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownloadHash}
              sx={{
                marginTop: 1,
                borderColor: "#6a11cb",
                color: "#6a11cb",
                "&:hover": { backgroundColor: "#6a11cb10" },
              }}
            >
              Download Hash
            </Button>
          </Paper>
        )}
      </Paper>
    </Box>
  );
}

export default UploadPage;


