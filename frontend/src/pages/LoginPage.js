import React, { useState } from "react";
import axios from "axios";
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import DiamondIcon from "@mui/icons-material/Diamond";

function LoginPage({ onLogin }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.username.toLowerCase() === "demo" && formData.password === "demo") {
      setTimeout(() => {
        onLogin("demo_token_123", { id: "demo_user_001", username: "Demo User" });
      }, 1000);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", formData);
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please verify your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        p: 2
      }}
    >
      <Paper 
        className="glass-panel"
        sx={{ 
          p: { xs: 4, md: 6 }, 
          width: "100%", 
          maxWidth: 480, 
          position: "relative",
          zIndex: 10,
          borderTop: "2px solid rgba(139, 92, 246, 0.5)",
          boxShadow: "0 20px 80px rgba(0,0,0,0.8), 0 0 40px rgba(139, 92, 246, 0.2)"
        }}
      >
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Box 
            sx={{ 
              width: 70, height: 70, borderRadius: "20px", 
              background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3,
              boxShadow: "0 10px 30px rgba(139, 92, 246, 0.5)",
              animation: "pulseGlow 3s infinite alternate"
            }}
          >
            <DiamondIcon sx={{ color: "#fff", fontSize: 36 }} />
          </Box>
          <Typography variant="h3" sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 2 }}>
            Credence
          </Typography>
          <Typography variant="body1" sx={{ color: "#94a3b8" }}>
            Identify Yourself. Secure the Network.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="USERNAME IDENTIFIER"
            variant="filled"
            margin="normal"
            disabled={loading}
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            InputProps={{
              startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: "#8b5cf6" }} /></InputAdornment>,
              disableUnderline: true,
            }}
            sx={{
              "& .MuiFilledInput-root": {
                color: "#fff",
                bgcolor: "rgba(0, 0, 0, 0.4)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s ease",
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.6)", borderColor: "rgba(255, 255, 255, 0.2)" },
                "&.Mui-focused": { bgcolor: "rgba(0, 0, 0, 0.8)", borderColor: "#8b5cf6", boxShadow: "0 0 15px rgba(139, 92, 246, 0.3)" },
              },
              "& .MuiInputLabel-root": { color: "#64748b", fontWeight: 700, letterSpacing: 1 },
              "& .MuiInputLabel-root.Mui-focused": { color: "#8b5cf6" }
            }}
          />
          <TextField
            fullWidth
            label="CRYPTOGRAPHIC KEY"
            type={showPassword ? "text" : "password"}
            variant="filled"
            margin="normal"
            disabled={loading}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: "#8b5cf6" }} /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: "#64748b" }}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              disableUnderline: true,
            }}
            sx={{
              mb: 5, mt: 3,
              "& .MuiFilledInput-root": {
                color: "#fff",
                bgcolor: "rgba(0, 0, 0, 0.4)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s ease",
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.6)", borderColor: "rgba(255, 255, 255, 0.2)" },
                "&.Mui-focused": { bgcolor: "rgba(0, 0, 0, 0.8)", borderColor: "#8b5cf6", boxShadow: "0 0 15px rgba(139, 92, 246, 0.3)" },
              },
              "& .MuiInputLabel-root": { color: "#64748b", fontWeight: 700, letterSpacing: 1 },
              "& .MuiInputLabel-root.Mui-focused": { color: "#8b5cf6" }
            }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ 
              py: 2.5, 
              borderRadius: 2,
              fontSize: "1.1rem",
              background: "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)",
              boxShadow: "0 10px 20px rgba(59, 130, 246, 0.3)",
              "&:hover": { 
                background: "linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)",
                boxShadow: "0 15px 30px rgba(59, 130, 246, 0.5)",
              }
            }}
          >
            {loading ? <CircularProgress size={28} sx={{ color: "#fff" }} /> : "INITIALIZE HANDSHAKE"}
          </Button>
        </form>
      </Paper>
      
      {/* Demo Hint */}
      <Box sx={{ position: "absolute", bottom: 30, textAlign: "center", zIndex: 10 }}>
        <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.4)", letterSpacing: 3 }}>
          Demo Access: demo / demo
        </Typography>
      </Box>
    </Box>
  );
}

export default LoginPage;
