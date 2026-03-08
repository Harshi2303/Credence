import React, { useState } from "react";

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();

    // For now, just validate inputs and log to console
    if (!name || !email || !password) {
      alert("Please fill in all fields");
      return;
    }

    // Here you would normally call your backend API to create a user
    console.log("Signing up:", { name, email, password });
    alert("Signup successful! Now log in.");
    
    // Optionally, reset the form
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div style={{ margin: "2rem auto", maxWidth: 400, textAlign: "center" }}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      <p style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
        Already have an account? Please log in below.
      </p>
    </div>
  );
}

export default SignupPage;
