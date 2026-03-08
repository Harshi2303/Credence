import React, { useState } from "react";
import axios from "axios";

function UserUpload({ user }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Select a file first");

    const formData = new FormData();
    formData.append("document", file);
    formData.append("username", user.username);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData);
      setMessage(res.data.message);
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage("Upload failed");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h2>Upload Document</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={handleUpload}>Upload</button>
      <br /><br />
      {message && <p>{message}</p>}
    </div>
  );
}

export default UserUpload;
