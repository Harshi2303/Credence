import React, { useMemo, useState } from "react";
import "./App.css";
import DocumentVault from "./DocumentVault";
import VerifyPage from "./VerifyPage";
import { Box, Typography } from "@mui/material";


const STORAGE_KEY = "credence_registered_users";

function App() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [fullName, setFullName] = useState("");
  const [connectedAddress, setConnectedAddress] = useState("");
  const [fakeLoginId, setFakeLoginId] = useState("demo_user_001");
  const [activeUser, setActiveUser] = useState(null);
  const [dashboardView, setDashboardView] = useState("selection");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const shortAddress = useMemo(() => {
    if (!connectedAddress) return "";
    return `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`;
  }, [connectedAddress]);

  const clearMessages = () => {
    setStatusMessage("");
    setErrorMessage("");
  };

  const getStoredUsers = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const saveStoredUsers = (users) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  };

  const requireMetaMask = () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }
  };

  const requestPrimaryAccount = async () => {
    requireMetaMask();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || !accounts.length) {
      throw new Error("No wallet account found. Please unlock MetaMask and try again.");
    }
    return accounts[0];
  };

  const connectForSignup = async () => {
    clearMessages();
    setIsBusy(true);
    try {
      const account = await requestPrimaryAccount();
      setConnectedAddress(account);
      setStatusMessage("Wallet connected. Enter your full name to complete Sign Up.");
    } catch (error) {
      setErrorMessage(error.message || "Unable to connect wallet.");
    } finally {
      setIsBusy(false);
    }
  };

  const completeSignup = async () => {
    clearMessages();
    if (!connectedAddress) {
      setErrorMessage("Connect MetaMask before signing up.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage("Full Name is required.");
      return;
    }

    const users = getStoredUsers();
    users[connectedAddress.toLowerCase()] = {
      walletAddress: connectedAddress,
      fullName: fullName.trim(),
    };
    saveStoredUsers(users);

    setFullName("");
    setConnectedAddress("");
    setIsLoginView(true);
    setStatusMessage("Registration successful! Please sign in with your wallet.");
  };

  const loginWithMetaMask = async () => {
    clearMessages();
    setIsBusy(true);

    try {
      const account = await requestPrimaryAccount();
      const users = getStoredUsers();
      const user = users[account.toLowerCase()];

      if (!user) {
        setErrorMessage("Account not found. Please Sign Up first.");
        return;
      }

      const message = `Credence login verification for ${account}`;
      await window.ethereum.request({
        method: "personal_sign",
        params: [message, account],
      });

      setActiveUser({
        type: "wallet",
        id: account,
        name: user.fullName,
      });
      setDashboardView("selection");
      setStatusMessage(`Login successful. Welcome, ${user.fullName}!`);
    } catch (error) {
      if (error && error.code === 4001) {
        setErrorMessage("Signature request was rejected. Please try again.");
      } else {
        setErrorMessage(error.message || "Login failed. Please try again.");
      }
    } finally {
      setIsBusy(false);
    }
  };

  const switchView = (nextIsLogin) => {
    clearMessages();
    setIsLoginView(nextIsLogin);
    setFullName("");
    setConnectedAddress("");
  };

  const fakeLogin = () => {
    clearMessages();
    if (!fakeLoginId.trim()) {
      setErrorMessage("Enter a fake Login ID to continue.");
      return;
    }
    const id = fakeLoginId.trim();
    localStorage.setItem("credence_fake_login_id", id);
    setActiveUser({
      type: "fake",
      id,
      name: "Demo User",
    });
    setDashboardView("selection");
    setStatusMessage(`Signed in with fake Login ID: ${id}`);
  };

  const logout = () => {
    setActiveUser(null);
    setDashboardView("selection");
    clearMessages();
    setStatusMessage("You have been signed out.");
  };

  const shortWallet = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getActiveIdentity = () => {
    if (!activeUser) return "";
    if (activeUser.type === "wallet") return shortWallet(activeUser.id);
    return `ID ${activeUser.id}`;
  };

  if (activeUser) {
    return (
      <div className="auth-page">
        <div className="dashboard-shell">
          <div className="dashboard-header">
            <div>
              <h1 className="gradient-text" style={{ fontFamily: 'Space Grotesk', letterSpacing: '2px' }}>{"TERMINAL - ACTIVE"}</h1>
              <p className="subtitle" style={{ color: '#94a3b8', fontWeight: 700 }}>
                OPERATOR: {activeUser.name} {"-"} SESSION: {getActiveIdentity()}
              </p>
            </div>
            <button className="secondary-button" onClick={logout} type="button">
              TERMINATE
            </button>
          </div>

          {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

          {dashboardView === "selection" ? (
            <div className="role-grid">
              <div className="role-card" onClick={() => setDashboardView("owner")} style={{ cursor: 'pointer' }}>
                <Typography variant="h4" sx={{ mb: 2, fontFamily: 'Space Grotesk', color: '#fff' }}>SECURE STORAGE</Typography>
                <p style={{ color: '#94a3b8' }}>Upload and protect your documents using IPFS and Blockchain protocols.</p>
                <Box sx={{ mt: 3, display: "flex", alignItems: "center", color: "#8b5cf6" }}>
                  <Typography variant="button" sx={{ fontWeight: 800 }}>LAUNCH VAULT</Typography>
                  <Box sx={{ ml: 1 }}>→</Box>
                </Box>
              </div>
              <div className="role-card" onClick={() => setDashboardView("verifier")} style={{ cursor: 'pointer' }}>
                <Typography variant="h4" sx={{ mb: 2, fontFamily: 'Space Grotesk', color: '#fff' }}>VERIFY DOCUMENTS</Typography>
                <p style={{ color: '#94a3b8' }}>Authenticate digital records against the blockchain mainnet instantly.</p>
                <Box sx={{ mt: 3, display: "flex", alignItems: "center", color: "#3b82f6" }}>
                  <Typography variant="button" sx={{ fontWeight: 800 }}>INITIALIZE READER</Typography>
                  <Box sx={{ ml: 1 }}>→</Box>
                </Box>
              </div>
            </div>
          ) : null}

          {dashboardView === "owner" ? (
            <DocumentVault
              activeUser={activeUser}
              walletDisplay={getActiveIdentity()}
              onBack={() => setDashboardView("selection")}
            />
          ) : null}

          {dashboardView === "verifier" ? (
            <VerifyPage onBack={() => setDashboardView("selection")} />
          ) : null}

        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Credence Wallet Access</h1>
        <p className="subtitle">
          {isLoginView
            ? "Sign in with your wallet address."
            : "Create an account using your MetaMask wallet."}
        </p>

        {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
        {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

        {isLoginView ? (
          <div className="section">
            <button className="primary-button" onClick={loginWithMetaMask} disabled={isBusy}>
              {isBusy ? "Connecting..." : "Login with MetaMask"}
            </button>

            <div className="divider">or use development login</div>
            <label htmlFor="fakeLoginId">Fake Login ID</label>
            <input
              id="fakeLoginId"
              value={fakeLoginId}
              onChange={(event) => setFakeLoginId(event.target.value)}
              placeholder="demo_user_001"
              type="text"
              disabled={isBusy}
            />
            <button className="primary-button" onClick={fakeLogin} type="button" disabled={isBusy}>
              Continue with Fake Login ID
            </button>
            <p className="switch-text">
              New here?{" "}
              <button className="link-button" onClick={() => switchView(false)} type="button">
                Go to Sign Up
              </button>
            </p>
          </div>
        ) : (
          <div className="section">
            <button className="primary-button" onClick={connectForSignup} disabled={isBusy}>
              {isBusy ? "Connecting..." : "Connect MetaMask"}
            </button>

            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              disabled={!connectedAddress || isBusy}
            />

            {connectedAddress ? (
              <p className="wallet-chip">Connected: {shortAddress}</p>
            ) : (
              <p className="wallet-chip">Wallet not connected</p>
            )}

            <button
              className="primary-button"
              onClick={completeSignup}
              type="button"
              disabled={!connectedAddress || isBusy}
            >
              Complete Sign Up
            </button>

            <p className="switch-text">
              Already registered?{" "}
              <button className="link-button" onClick={() => switchView(true)} type="button">
                Back to Login
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

