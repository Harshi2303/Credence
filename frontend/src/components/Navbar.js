import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from "@mui/material";
import DiamondIcon from "@mui/icons-material/Diamond";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";

function Navbar({ activePage, setPage, onLogout }) {
  const navItems = [
    { id: "dashboard", label: "DASHBOARD", icon: <DashboardIcon sx={{ fontSize: 20 }} /> }
  ];

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        background: "rgba(10, 5, 20, 0.4)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        color: "#fff",
        px: { xs: 1, md: 4 }
      }}
    >
      <Toolbar disableGutters sx={{ height: 90 }}>
        <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer", flexGrow: { xs: 1, md: 0 }, mr: 8 }} onClick={() => setPage("dashboard")}>
          <Box 
            sx={{ 
              width: 44, height: 44, borderRadius: "12px", 
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", mr: 2,
              boxShadow: "0 0 20px rgba(139, 92, 246, 0.6)",
              animation: "pulseGlow 2s infinite alternate"
            }}
          >
            <DiamondIcon sx={{ color: "#fff", fontSize: 24 }} />
          </Box>
          <Typography variant="h4" sx={{ letterSpacing: 1, mt: 0.5 }}>
            CREDENCE
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, gap: 2 }}>
          {navItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => setPage(item.id)}
              startIcon={item.icon}
              sx={{ 
                color: activePage === item.id ? "#fff" : "rgba(255,255,255,0.5)",
                fontWeight: 800,
                letterSpacing: 1,
                bgcolor: activePage === item.id ? "rgba(255,255,255,0.1)" : "transparent",
                px: 3, py: 1.5, borderRadius: 3,
                border: activePage === item.id ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)", color: "#fff" }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Tooltip title="OPERATOR PROFILE">
            <IconButton sx={{ bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}>
              <PersonIcon sx={{ color: "#fff" }} />
            </IconButton>
          </Tooltip>
          <Button 
            variant="outlined" 
            endIcon={<LogoutIcon />} 
            onClick={onLogout}
            sx={{ 
              borderRadius: "50px", 
              border: "1px solid rgba(239, 68, 68, 0.3)", 
              color: "#fb7185",
              fontWeight: 800,
              px: 3,
              "&:hover": { borderColor: "#f43f5e", color: "#fff", bgcolor: "rgba(225, 29, 72, 0.8)", boxShadow: "0 0 20px rgba(225, 29, 72, 0.4)" }
            }}
          >
            TERMINATE
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
