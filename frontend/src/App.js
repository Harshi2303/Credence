import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import UploadPage from "./pages/UploadPage";
import VerifyPage from "./pages/VerifyPage";
import DocumentVault from "./pages/DocumentVault";
import LoginPage from "./pages/LoginPage";
import { Box, Typography, Container, Paper, Grid, Card, CardContent } from "@mui/material";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [activePage, setActivePage] = useState("dashboard");

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setActivePage("dashboard");
  };

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard user={user} setPage={setActivePage} />;
      case "upload":
        return <UploadPage token={token} />;
      case "verify":
        return <VerifyPage />;
      case "vault":
        return <DocumentVault activeUser={user} onBack={() => setActivePage("dashboard")} />;
      default:
        return <Dashboard user={user} setPage={setActivePage} />;
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8faff" }}>
      <Navbar activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {renderPage()}
      </Container>
    </Box>
  );
}

function Dashboard({ user, setPage }) {
  const stats = [
    { title: "Verifiable Documents", icon: "📄", color: "#2575fc", action: "upload", desc: "Add new documents to the registry." },
    { title: "Public Verification", icon: "🔍", color: "#6a11cb", action: "verify", desc: "Check document authenticity instantly." },
    { title: "Secure Vault", icon: "🛡️", color: "#434343", action: "vault", desc: "Manage and share your assets." },
  ];

  return (
    <Box>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" fontWeight={800} sx={{ color: "#333", mb: 1 }}>
          Welcome back, {user?.username}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Credence Secure Registry Management
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {stats.map((item) => (
          <Grid item xs={12} md={4} key={item.title}>
            <Card 
              onClick={() => setPage(item.action)}
              sx={{ 
                height: "100%", 
                borderRadius: 5, 
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": { 
                  transform: "translateY(-8px)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h1" sx={{ fontSize: "3rem", mb: 2 }}>{item.icon}</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: item.color, mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Paper sx={{ mt: 6, p: 4, borderRadius: 5, bgcolor: "#fff", border: "1px solid #eee" }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>System Status</Typography>
        <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
            <Box><Typography variant="caption" color="text.secondary">NETWORK</Typography><Typography fontWeight="bold" color="success.main">● LIVE (Sepolia Testnet)</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">ENCRYPTION</Typography><Typography fontWeight="bold">AES-256 / SHA-256</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">STORAGE</Typography><Typography fontWeight="bold">IPFS Interconnected</Typography></Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default App;
