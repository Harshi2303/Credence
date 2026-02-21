import React, { useEffect, useState } from "react";
import axios from "axios";

function ReviewerDashboard({ user }) {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:5000/documents?role=${user.role}`)
      .then(res => setDocs(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h2>Uploaded Documents</h2>
      {docs.length === 0 ? <p>No documents uploaded yet.</p> :
        docs.map((d, idx) => (
          <div key={idx} style={{ marginBottom: 20 }}>
            <strong>{d.filename}</strong> uploaded by {d.uploadedBy} on {new Date(d.timestamp).toLocaleString()}
            <br />
            <span>SHA-256 Hash: {d.hash}</span>
          </div>
        ))
      }
    </div>
  );
}

export default ReviewerDashboard;
