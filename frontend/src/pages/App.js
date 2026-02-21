import React, { useState } from "react";
import SignupPage from "./SignupPage";
import LoginPage from "./LoginPage";
import UploadPage from "./UploadPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <div>
      {!token ? (
        <>
          <SignupPage />
          <LoginPage onLogin={handleLogin} />
        </>
      ) : (
        <UploadPage token={token} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

