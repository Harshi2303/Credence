import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
} from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import LogoutIcon from "@mui/icons-material/Logout";

function Navbar({ activePage, setPage, onLogout }) {
  const navItems = [
    { label: "Dashboard", value: "dashboard" },
    { label: "Upload", value: "upload" },
    { label: "Verify", value: "verify" },
    { label: "Vault", value: "vault" },
  ];

  return (
    <AppBar position="sticky" sx={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(10px)", color: "#333", boxShadow: "none", borderBottom: "1px solid #eee" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <VerifiedUserIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1, color: "#2575fc" }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontWeight: 800,
              letterSpacing: ".1rem",
              color: "#2575fc",
              textDecoration: "none",
            }}
          >
            CREDENCE
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, justifyContent: "center", gap: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.value}
                onClick={() => setPage(item.value)}
                sx={{
                  my: 2,
                  color: activePage === item.value ? "#2575fc" : "#555",
                  display: "block",
                  fontWeight: activePage === item.value ? "bold" : "medium",
                  borderBottom: activePage === item.value ? "2px solid #2575fc" : "none",
                  borderRadius: 0,
                  "&:hover": { color: "#2575fc", backgroundColor: "transparent" },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            {onLogout && (
              <IconButton onClick={onLogout} color="error" title="Logout">
                <LogoutIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
