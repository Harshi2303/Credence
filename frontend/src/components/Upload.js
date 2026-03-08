import React, { useState } from "react";
import axios from "axios";
import { Box, Button, Typography, Paper, LinearProgress } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

function UploadPage() {
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = () => {
    if (!file) return alert("Please select a file");
    setLoading(true);

    const formData = new FormData();
    formData.append("document", file);

    axios
      .post("http://localhost:5000/upload", formData)
      .then((res) => setHash(res.data.hash))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#f5f5f5",
      }}
    >
      <Paper
        elevation={4}
        sx={{
          padding: 4,
          maxWidth: 500,
          width: "100%",
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Upload Document
        </Typography>

        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{ marginTop: 2 }}
        >
          Select File
          <input type="file" hidden onChange={handleFileChange} />
        </Button>

        {file && (
          <Typography sx={{ marginTop: 2 }}>{file.name}</Typography>
        )}

        <Button
          variant="contained"
          color="success"
          onClick={handleUpload}
          sx={{ marginTop: 3 }}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </Button>

        {loading && <LinearProgress sx={{ marginTop: 2 }} />}

        {hash && (
          <Paper
            elevation={2}
            sx={{ marginTop: 3, padding: 2, wordBreak: "break-all" }}
          >
            <Typography variant="subtitle1">SHA-256 Hash:</Typography>
            <Typography variant="body2">{hash}</Typography>
          </Paper>
        )}
      </Paper>
    </Box>
  );
}

export default UploadPage;
