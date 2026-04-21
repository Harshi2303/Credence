import React, { useState } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { Box, Typography, Container, Paper, Grid, Card, CardContent } from "@mui/material";
import Navbar from "./components/Navbar";
import UploadPage from "./pages/UploadPage";
import VerifyPage from "./pages/VerifyPage";
import DocumentVault from "./pages/DocumentVault";
import LoginPage from "./pages/LoginPage";

// Create Premium Global Theme
const globalTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: "transparent", 
      paper: "rgba(20, 15, 30, 0.5)",
    },
    primary: {
      main: "#8b5cf6",
      light: "#a855f7",
      dark: "#6d28d9",
    },
    secondary: {
      main: "#ec4899",
      light: "#f472b6",
      dark: "#be185d",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
  },
  typography: {
    fontFamily: '"Outfit", sans-serif',
    h1: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, letterSpacing: "-0.04em" },
    h2: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, letterSpacing: "-0.03em" },
    h3: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, letterSpacing: "-0.02em" },
    h4: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 700, letterSpacing: "0.02em" },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: "12px 28px",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          boxShadow: "none",
          "&:hover": {
            transform: "translateY(-3px) scale(1.02)",
            boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.4)",
          },
          "&:active": {
            transform: "translateY(0) scale(0.98)",
          }
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          backgroundImage: "none",
          boxShadow: "none"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        }
      }
    }
  },
});

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

  return (
    <ThemeProvider theme={globalTheme}>
      <CssBaseline />
      <div className="animated-bg" />
      
      {!token ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
          <Navbar activePage={activePage} setPage={setActivePage} onLogout={handleLogout} />
          <Container maxWidth="lg" sx={{ py: 8, flexGrow: 1, mt: 8 }}>
            <FadePage activePage={activePage}>
              {activePage === "dashboard" && <Dashboard user={user} setPage={setActivePage} />}
              {activePage === "upload" && <UploadPage token={token} />}
              {activePage === "verify" && <VerifyPage />}
              {activePage === "vault" && <DocumentVault activeUser={user} onBack={() => setActivePage("dashboard")} />}
            </FadePage>
          </Container>
        </Box>
      )}
    </ThemeProvider>
  );
}

// Helper to smooth out page transitions quickly
const FadePage = ({ children, activePage }) => {
  return (
    <Box key={activePage} sx={{ animation: "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
      {children}
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </Box>
  );
};

function Dashboard({ user, setPage }) {
  const stats = [
    { title: "Verifiable Documents", icon: "📑", glow: "rgba(59, 130, 246, 0.6)", action: "upload", desc: "Instantiate net-new digital assets inside the zero-knowledge verification pool." },
    { title: "Public Verification", icon: "💎", glow: "rgba(139, 92, 246, 0.6)", action: "verify", desc: "Cross-check and authenticate digital identities instantly via external OCR pipelines." },
    { title: "Secure Vault", icon: "🛡️", glow: "rgba(236, 72, 153, 0.6)", action: "vault", desc: "Manage securely stored encrypted assets strictly locked to your access tier." },
  ];

  return (
    <Box>
      <Box sx={{ mb: 10, textAlign: "center" }}>
        <Typography variant="h2" sx={{ mb: 3 }} className="gradient-text">
          TERMINAL // ACTIVE
        </Typography>
        <Typography variant="h5" sx={{ color: "#fff", mb: 2 }}>
          Welcome back, {user?.username}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: "auto", fontSize: "1.1rem" }}>
          You are successfully connected to the Credence encrypted mainnet. All visual assets and document validations are locked strictly to your cryptographic session.
        </Typography>
      </Box>

      <Grid container spacing={5}>
        {stats.map((item, idx) => (
          <Grid item xs={12} md={4} key={item.title}>
            <Card 
              onClick={() => setPage(item.action)}
              className="glass-panel"
              sx={{ 
                height: "100%", 
                cursor: "pointer",
                padding: "2px", // Space for the glowing border
                transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                "&:hover": { 
                  transform: "translateY(-15px) scale(1.03)",
                  boxShadow: `0 30px 60px -15px ${item.glow}`,
                  borderColor: "rgba(255,255,255,0.4)"
                },
                "&:hover .icon-bg": {
                  transform: "scale(1.15) rotate(10deg)",
                  boxShadow: `0 0 30px ${item.glow}`
                }
              }}
            >
              <CardContent sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column" }}>
                <Box 
                  className="icon-bg"
                  sx={{ 
                    width: 70, height: 70, borderRadius: "20px", display: "flex", 
                    alignItems: "center", justifyContent: "center", 
                    background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.0))`,
                    border: "1px solid rgba(255,255,255,0.2)",
                    mb: 4,
                    transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  }}
                >
                  <Typography variant="h3">{item.icon}</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2, color: "#fff", lineHeight: 1.2 }}>
                  {item.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1, lineHeight: 1.7 }}>
                  {item.desc}
                </Typography>
                
                <Box sx={{ mt: 3, display: "flex", alignItems: "center", color: item.glow.replace("0.6", "1") }}>
                  <Typography variant="button" sx={{ fontWeight: 800 }}>LAUNCH MODULE</Typography>
                  <Box sx={{ ml: 1, animation: "slideRight 1s infinite alternate" }}>→</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Grid container spacing={4} sx={{ mt: 6 }}>
        <Grid item xs={12}>
          <Paper className="glass-panel" sx={{ p: 5, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
            <Box>
              <Typography variant="h5" sx={{ color: "#fff", mb: 1 }}>SYSTEM DIAGNOSTICS</Typography>
              <Typography variant="body1" color="text.secondary">All microservices are operating with zero degraded performance.</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 5, flexWrap: "wrap", background: "rgba(0,0,0,0.3)", p: 3, borderRadius: 4, border: "1px solid rgba(255,255,255,0.05)" }}>
                <StatusBadge label="NETWORK" value="CONNECTED" color="#10b981" />
                <StatusBadge label="LATENCY" value="14ms" color="#3b82f6" />
                <StatusBadge label="UPTIME" value="99.99%" color="#a855f7" />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <style>{`@keyframes slideRight { from { transform: translateX(0); } to { transform: translateX(5px); } }`}</style>
    </Box>
  );
}

const StatusBadge = ({ label, value, color }) => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, letterSpacing: 2, mb: 0.5 }}>{label}</Typography>
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, mr: 1.5, boxShadow: `0 0 12px ${color}` }} />
      <Typography variant="h6" sx={{ color: "#fff", letterSpacing: 1 }}>{value}</Typography>
    </Box>
  </Box>
);

export default App;
