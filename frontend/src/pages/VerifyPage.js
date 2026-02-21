import axios from "axios";
import { useState } from "react";

function VerifyPage() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/documents/verify",
        { hash }
      );

      setResult(res.data);
    } catch (error) {
      alert("Verification failed");
    }
  };

  return (
    <div>
      <h2>Verify Document</h2>

      <input
        type="text"
        placeholder="Enter document hash"
        value={hash}
        onChange={(e) => setHash(e.target.value)}
      />

      <button onClick={handleVerify}>Verify</button>

      {result && (
        <div>
          {result.verified ? (
            <p style={{ color: "green" }}>
              Document Verified ✅ <br />
              Uploaded At: {new Date(result.uploadedAt).toLocaleString()}
            </p>
          ) : (
            <p style={{ color: "red" }}>
              Document Not Found ❌
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default VerifyPage;
