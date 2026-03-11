import React, { useMemo, useState } from "react";
import "./App.css";
import DocumentVault from "./DocumentVault";

const STORAGE_KEY = "credence_registered_users";
const DOCUMENTS_KEY = "credence_documents";

function App() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [fullName, setFullName] = useState("");
  const [connectedAddress, setConnectedAddress] = useState("");
  const [fakeLoginId, setFakeLoginId] = useState("demo_user_001");
  const [activeUser, setActiveUser] = useState(null);
  const [dashboardView, setDashboardView] = useState("selection");
  const [verifierHash, setVerifierHash] = useState("");
  const [verifierResult, setVerifierResult] = useState("");
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

  const clearDashboardMessages = () => {
    setVerifierResult("");
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

  const getStoredDocuments = () => {
    const raw = localStorage.getItem(DOCUMENTS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
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
    clearDashboardMessages();
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

  const handleVerifierCheck = () => {
    clearMessages();
    clearDashboardMessages();
    const query = verifierHash.trim().toLowerCase();
    if (!query) {
      setErrorMessage("Enter a hash to verify.");
      return;
    }
    const docs = getStoredDocuments();
    const match = docs.find((doc) => doc.hash.toLowerCase() === query);
    if (!match) {
      setVerifierResult("Verification result: Hash not found on-chain (placeholder lookup).");
      return;
    }
    setVerifierResult(
      `Verification result: VALID | File: ${match.fileName} | Owner: ${match.ownerName} | Time: ${new Date(
        match.createdAt
      ).toLocaleString()}`
    );
  };

  if (activeUser) {
    return (
      <div className="auth-page">
        <div className="dashboard-shell">
          <div className="dashboard-header">
            <div>
              <h1>Credence Dashboard</h1>
              <p className="subtitle">
                Connected as {activeUser.name} ({getActiveIdentity()})
              </p>
            </div>
            <button className="secondary-button" onClick={logout} type="button">
              Logout
            </button>
          </div>

          {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

          {dashboardView === "selection" ? (
            <div className="role-grid">
              <div className="role-card">
                <h2>Secure Storage</h2>
                <p>Upload and protect your documents using IPFS and Blockchain.</p>
                <button className="primary-button" onClick={() => setDashboardView("owner")} type="button">
                  Go to Vault
                </button>
              </div>
              <div className="role-card">
                <h2>Verify Documents</h2>
                <p>Authenticate digital records against the blockchain.</p>
                <button className="primary-button" onClick={() => setDashboardView("verifier")} type="button">
                  Start Verifying
                </button>
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
            <div className="panel-card">
              <h2>Verifier Portal</h2>
              <p className="subtitle">Paste a blockchain hash to validate its authenticity.</p>
              <label htmlFor="verifyHash">Search Hash</label>
              <input
                id="verifyHash"
                value={verifierHash}
                onChange={(event) => setVerifierHash(event.target.value)}
                placeholder="Enter SHA-256 hash"
                type="text"
              />
              <button className="primary-button" onClick={handleVerifierCheck} type="button">
                Verify Hash
              </button>
              {verifierResult ? <p className="status-message">{verifierResult}</p> : null}
              <button className="secondary-button" onClick={() => setDashboardView("selection")} type="button">
                Back to Role Selection
              </button>
            </div>
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

