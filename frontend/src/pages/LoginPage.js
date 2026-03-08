import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // You can later replace this with API login call
    if (username && password) {
      onLogin(username); // Call parent callback
    } else {
      alert("Please enter username and password");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to right, #6a11cb, #2575fc)",
      }}
    >
      <Paper sx={{ padding: 5, maxWidth: 400, width: "100%", textAlign: "center" }}>
        <Typography variant="h4" sx={{ marginBottom: 3, color: "#2575fc" }}>
          Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            fullWidth
            sx={{ marginBottom: 2 }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            sx={{ marginBottom: 3 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" sx={{ width: "100%", background: "#2575fc" }}>
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default LoginPage;
