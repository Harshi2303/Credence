import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Button, TextField, Typography, Paper, Container, Fade, Alert } from "@mui/material";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError("Please enter username and password");
    
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/login", { username, password });
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "radial-gradient(circle at top left, #6a11cb 0%, #2575fc 100%)",
        animation: "bgShift 10s ease infinite alternate",
        "@keyframes bgShift": {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "100% 100%" }
        }
      }}
    >
      <Fade in={true} timeout={1000}>
        <Paper 
          elevation={24} 
          sx={{ 
            padding: 6, 
            maxWidth: 450, 
            width: "90%", 
            textAlign: "center", 
            borderRadius: 6,
            backdropFilter: "blur(10px)",
            bgcolor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(255,255,255,0.3)"
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" fontWeight={900} sx={{ color: "#2575fc", mb: 1 }}>
              Credence
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Secure Document Verification 2.0
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Username"
              fullWidth
              variant="filled"
              sx={{ marginBottom: 2.5 }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              variant="filled"
              sx={{ marginBottom: 4 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth
              disabled={loading}
              sx={{ 
                py: 1.5,
                fontWeight: "bold",
                borderRadius: 3,
                fontSize: "1.1rem",
                textTransform: "none",
                background: "linear-gradient(90deg, #2575fc 0%, #6a11cb 100%)",
                boxShadow: "0 8px 16px rgba(37, 117, 252, 0.3)",
                "&:hover": {
                  boxShadow: "0 12px 20px rgba(37, 117, 252, 0.4)",
                  transform: "translateY(-1px)"
                }
              }}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account? <Button sx={{ fontWeight: "bold", textTransform: "none" }}>Contact Admin</Button>
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
}

export default LoginPage;
