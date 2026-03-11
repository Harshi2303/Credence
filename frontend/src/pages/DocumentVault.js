import React, { useEffect, useMemo, useState } from "react";
import "./DocumentVault.css";

const DOCUMENTS_KEY = "credence_documents";
const CATEGORIES = ["Academic", "Financial", "Identity", "Healthcare"];
const STATUS_OPTIONS = ["All Statuses", "Active", "Revoked", "Processing"];
const CHAIN_EXPLORER = {
  "0x1": "https://etherscan.io",
  "0xaa36a7": "https://sepolia.etherscan.io",
  "0x5": "https://goerli.etherscan.io",
  "0x89": "https://polygonscan.com",
  "0x13881": "https://mumbai.polygonscan.com",
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toShort = (value, left = 8, right = 6) => {
  if (!value) return "-";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
};

const formatDate = (isoDate) => {
  try {
    return new Date(isoDate).toLocaleString();
  } catch {
    return isoDate;
  }
};

const safeReadDocs = () => {
  const raw = localStorage.getItem(DOCUMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWriteDocs = (docs) => {
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
};

const getExplorerBase = (chainId) => CHAIN_EXPLORER[chainId] || "https://sepolia.etherscan.io";

function DocumentVault({ activeUser, walletDisplay, onBack }) {
  const [documents, setDocuments] = useState(safeReadDocs);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [networkId, setNetworkId] = useState("0xaa36a7");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [shareBusyId, setShareBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [uploadForm, setUploadForm] = useState({
    file: null,
    category: "Academic",
    displayName: "",
    tag: "",
  });
  const [editForm, setEditForm] = useState({
    displayName: "",
    category: "Academic",
    tag: "",
    replaceFile: null,
  });

  const isWalletSession = activeUser && activeUser.type === "wallet";

  useEffect(() => {
    const resolveChain = async () => {
      if (!window.ethereum) return;
      try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        if (chainId) setNetworkId(chainId);
      } catch {
        // ignore and keep default
      }
    };
    resolveChain();
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        if (categoryFilter !== "All Categories" && doc.category !== categoryFilter) return false;
        if (statusFilter !== "All Statuses" && doc.status !== statusFilter) return false;
        if (!searchTerm.trim()) return true;
        const q = searchTerm.trim().toLowerCase();
        return (
          (doc.displayName || "").toLowerCase().includes(q) ||
          (doc.fileName || "").toLowerCase().includes(q) ||
          (doc.tag || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [documents, searchTerm, categoryFilter, statusFilter]);

  const groupedDocuments = useMemo(() => {
    const map = {};
    for (const category of CATEGORIES) map[category] = [];
    for (const doc of filteredDocuments) {
      const key = CATEGORIES.includes(doc.category) ? doc.category : "Academic";
      map[key].push(doc);
    }
    return map;
  }, [filteredDocuments]);

  const persistDocs = (nextDocs) => {
    setDocuments(nextDocs);
    safeWriteDocs(nextDocs);
  };

  const resetNotices = () => {
    setMessage("");
    setError("");
  };

  const hashFile = async (file) => {
    const data = await file.arrayBuffer();
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  };

  const makeTxHash = () => {
    const chars = "abcdef0123456789";
    let out = "0x";
    for (let i = 0; i < 64; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  const requireMetaMaskSignature = async (purpose, docId = "") => {
    if (!isWalletSession) {
      // Development fallback: allow CRUD when user logged in via fake login ID.
      return "DEV_BYPASS_SIGNATURE";
    }
    if (!window.ethereum) {
      throw new Error("MetaMask not detected. Please install MetaMask.");
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || !accounts.length) {
      throw new Error("No MetaMask account available.");
    }
    const activeAccount = accounts[0].toLowerCase();
    if (activeAccount !== activeUser.id.toLowerCase()) {
      throw new Error("Connected wallet does not match signed-in user.");
    }
    const signingMessage = `Credence access control: ${purpose}${docId ? ` | doc:${docId}` : ""} | ${new Date().toISOString()}`;
    await window.ethereum.request({
      method: "personal_sign",
      params: [signingMessage, accounts[0]],
    });
    return accounts[0];
  };

  const mockUploadToIpfs = async (fileHash) => {
    await delay(350);
    return {
      cid: `bafy${fileHash.slice(0, 28)}`,
      gatewayUrl: `https://ipfs.io/ipfs/bafy${fileHash.slice(0, 28)}`,
    };
  };

  const createAudit = (action, data = {}) => ({
    action,
    at: new Date().toISOString(),
    ...data,
  });

  const readFileAsDataUrl = async (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("File read failed."));
      reader.readAsDataURL(file);
    });

  const handleCreate = async () => {
    resetNotices();
    if (!uploadForm.file) {
      setError("Please choose a file.");
      return;
    }
    setBusyAction("create");
    try {
      await requireMetaMaskSignature("CREATE");
      const fileHash = await hashFile(uploadForm.file);
      const fileDataUrl = await readFileAsDataUrl(uploadForm.file);
      const ipfs = await mockUploadToIpfs(fileHash);
      await delay(400);
      const txHash = makeTxHash();
      const now = new Date().toISOString();
      const docId = `doc_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
      const doc = {
        id: docId,
        displayName: uploadForm.displayName.trim() || uploadForm.file.name,
        fileName: uploadForm.file.name,
        category: uploadForm.category,
        tag: uploadForm.tag.trim(),
        hash: fileHash,
        cid: ipfs.cid,
        gatewayUrl: ipfs.gatewayUrl,
        fileDataUrl,
        txHash,
        chainId: networkId,
        status: "Active",
        ownerId: activeUser.id,
        ownerName: activeUser.name,
        version: 1,
        createdAt: now,
        updatedAt: now,
        auditTrail: [
          createAudit("CREATED", { txHash, cid: ipfs.cid, hash: fileHash, version: 1, category: uploadForm.category }),
        ],
      };
      persistDocs([doc, ...documents]);
      setMessage("Upload complete: hash stored, IPFS CID created, and on-chain transaction simulated.");
      setUploadForm({ file: null, category: "Academic", displayName: "", tag: "" });
      setIsUploadOpen(false);
    } catch (err) {
      setError(err.message || "Create operation failed.");
    } finally {
      setBusyAction("");
    }
  };

  const openEditModal = (doc) => {
    setSelectedDoc(doc);
    setEditForm({
      displayName: doc.displayName || doc.fileName,
      category: doc.category || "Academic",
      tag: doc.tag || "",
      replaceFile: null,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    resetNotices();
    if (!selectedDoc) return;
    setBusyAction(`edit_${selectedDoc.id}`);
    try {
      await requireMetaMaskSignature("UPDATE", selectedDoc.id);
      let nextHash = selectedDoc.hash;
      let nextCid = selectedDoc.cid;
      let nextGateway = selectedDoc.gatewayUrl;
      let nextDataUrl = selectedDoc.fileDataUrl || "";
      let txHash = selectedDoc.txHash || "";
      let version = selectedDoc.version || 1;
      const additionalAudit = [];

      const metadataChanged =
        editForm.displayName.trim() !== (selectedDoc.displayName || "").trim() ||
        editForm.category !== selectedDoc.category ||
        editForm.tag.trim() !== (selectedDoc.tag || "").trim();

      if (editForm.replaceFile) {
        nextHash = await hashFile(editForm.replaceFile);
        nextDataUrl = await readFileAsDataUrl(editForm.replaceFile);
        const ipfs = await mockUploadToIpfs(nextHash);
        nextCid = ipfs.cid;
        nextGateway = ipfs.gatewayUrl;
        txHash = makeTxHash();
        version += 1;
        additionalAudit.push(
          createAudit("VERSION_UPLOADED", {
            txHash,
            cid: nextCid,
            hash: nextHash,
            version,
            previousHash: selectedDoc.hash,
          })
        );
      }

      if (metadataChanged) {
        additionalAudit.push(
          createAudit("METADATA_UPDATED", {
            displayName: editForm.displayName.trim(),
            category: editForm.category,
            tag: editForm.tag.trim(),
          })
        );
      }

      const nextDocs = documents.map((doc) => {
        if (doc.id !== selectedDoc.id) return doc;
        return {
          ...doc,
          displayName: editForm.displayName.trim() || doc.fileName,
          category: editForm.category,
          tag: editForm.tag.trim(),
          hash: nextHash,
          cid: nextCid,
          gatewayUrl: nextGateway,
          fileDataUrl: nextDataUrl,
          txHash,
          chainId: networkId,
          version,
          updatedAt: new Date().toISOString(),
          status: "Active",
          auditTrail: [...(doc.auditTrail || []), ...additionalAudit],
        };
      });

      persistDocs(nextDocs);
      setMessage("Document metadata updated successfully.");
      setIsEditOpen(false);
      setSelectedDoc(null);
    } catch (err) {
      setError(err.message || "Update failed.");
    } finally {
      setBusyAction("");
    }
  };

  const handleRevoke = async (doc) => {
    resetNotices();
    setBusyAction(`revoke_${doc.id}`);
    try {
      await requireMetaMaskSignature("REVOKE", doc.id);
      const txHash = makeTxHash();
      const nextDocs = documents.map((item) => {
        if (item.id !== doc.id) return item;
        return {
          ...item,
          status: "Revoked",
          updatedAt: new Date().toISOString(),
          auditTrail: [...(item.auditTrail || []), createAudit("REVOKED", { txHash, hash: item.hash })],
        };
      });
      persistDocs(nextDocs);
      setMessage("Document has been revoked on-chain (simulated) and will fail verification.");
    } catch (err) {
      setError(err.message || "Revoke failed.");
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteLocal = async (doc) => {
    resetNotices();
    setBusyAction(`delete_${doc.id}`);
    try {
      await requireMetaMaskSignature("DELETE_LOCAL", doc.id);
      const nextDocs = documents.filter((item) => item.id !== doc.id);
      persistDocs(nextDocs);
      setMessage("Document removed from local vault view.");
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setBusyAction("");
    }
  };

  const handleShare = async (doc) => {
    resetNotices();
    setShareBusyId(doc.id);
    console.log("share:start", { id: doc.id, cid: doc.cid, hash: doc.hash });
    try {
      await requireMetaMaskSignature("SHARE", doc.id);
      if (!doc.cid) {
        console.log("share:missing-cid", { id: doc.id });
        throw new Error("Cannot share yet: missing IPFS CID.");
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const response = await fetch("http://localhost:5000/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cid: doc.cid,
          hash: doc.hash,
          docId: doc.id,
          owner: activeUser.id,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Sharing service temporarily unavailable");
      }
      const shareUrl = payload.shareUrl || "";
      if (!shareUrl) {
        throw new Error("Sharing service returned an empty link.");
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setMessage("Share link generated and copied.");
      console.log("share:success", { id: doc.id, shareUrl });
    } catch (err) {
      console.log("share:error", { id: doc.id, error: err && err.message ? err.message : err });
      setError(err.message || "Sharing service temporarily unavailable");
    } finally {
      setShareBusyId("");
    }
  };

  const openPreview = (doc) => {
    resetNotices();
    if (!doc.cid && !doc.fileDataUrl) {
      setError("Preview unavailable: missing IPFS reference.");
      return;
    }
    setPreviewDoc(doc);
  };

  const statusClass = (status) => {
    const value = (status || "").toLowerCase();
    if (value === "active") return "success";
    if (value === "processing") return "pending";
    return "failed";
  };

  return (
    <div className="vault-root">
      <div className="vault-toolbar">
        <h2>Document Management Vault</h2>
        <div className="wallet-display">Wallet: {walletDisplay}</div>
      </div>

      <div className="vault-controls">
        <input
          type="text"
          placeholder="Search by name, file, or tag..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option>All Categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button className="primary-button" type="button" onClick={() => setIsUploadOpen(true)}>
          New Upload
        </button>
        <button className="secondary-button" type="button" onClick={onBack}>
          Back
        </button>
      </div>

      {message ? <p className="status-message">{message}</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      {CATEGORIES.map((category) => (
        <section key={category} className="vault-section">
          <h3>{category}</h3>
          <div className="vault-grid">
            {groupedDocuments[category].length === 0 ? (
              <div className="empty-card">No documents for this category and filter.</div>
            ) : (
              groupedDocuments[category].map((doc) => {
                const hasTx = Boolean(doc.txHash);
                const chain = doc.chainId || networkId;
                const explorerUrl = hasTx ? `${getExplorerBase(chain)}/tx/${doc.txHash}` : "";
                return (
                  <article key={doc.id} className="file-card">
                    <div className="file-card-head">
                      <h4>{doc.displayName || doc.fileName}</h4>
                      <span className={`status-badge ${statusClass(doc.status)}`}>{doc.status || "Active"}</span>
                    </div>
                    <p className="meta-line">File: {doc.fileName}</p>
                    <p className="meta-line">Uploaded: {formatDate(doc.createdAt)}</p>
                    <p className="meta-line">Updated: {formatDate(doc.updatedAt || doc.createdAt)}</p>
                    <p className="meta-line">CID: {toShort(doc.cid)}</p>
                    <p className="meta-line">Hash: {toShort(doc.hash, 10, 8)}</p>
                    <p className="meta-line">Version: v{doc.version || 1}</p>
                    {doc.tag ? <p className="meta-line">Tag: {doc.tag}</p> : null}

                    <details className="audit-trail">
                      <summary>Time-stamped audit trail ({(doc.auditTrail || []).length})</summary>
                      <ul>
                        {(doc.auditTrail || []).slice().reverse().map((item, idx) => (
                          <li key={`${doc.id}_audit_${idx}`}>
                            <span>{item.action}</span> at <span>{formatDate(item.at)}</span>
                            {item.txHash ? ` | tx: ${toShort(item.txHash)}` : ""}
                          </li>
                        ))}
                      </ul>
                    </details>

                    <div className="file-actions">
                      <button className="secondary-button" type="button" onClick={() => openPreview(doc)}>
                        Preview
                      </button>
                      <button className="secondary-button" type="button" onClick={() => openEditModal(doc)}>
                        Edit
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => hasTx && window.open(explorerUrl, "_blank", "noopener,noreferrer")}
                        disabled={!hasTx}
                        title={!hasTx ? "Processing on-chain..." : "Open on block explorer"}
                      >
                        View on Blockchain
                      </button>
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => handleShare(doc)}
                        disabled={shareBusyId === doc.id}
                      >
                        {shareBusyId === doc.id ? "Sharing..." : "Share"}
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => handleRevoke(doc)}
                        disabled={busyAction === `revoke_${doc.id}` || doc.status === "Revoked"}
                      >
                        {doc.status === "Revoked" ? "Revoked" : "Revoke"}
                      </button>
                      <button
                        className="secondary-button danger"
                        type="button"
                        onClick={() => handleDeleteLocal(doc)}
                        disabled={busyAction === `delete_${doc.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      ))}

      {isUploadOpen ? (
        <div className="modal-overlay" onClick={() => setIsUploadOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>New Upload</h3>
            <p>Generate SHA-256 hash, upload to IPFS, and log hash on smart contract (simulated).</p>

            <label htmlFor="upFile">File</label>
            <input
              id="upFile"
              type="file"
              onChange={(event) => setUploadForm((p) => ({ ...p, file: event.target.files && event.target.files[0] }))}
            />

            <label htmlFor="upName">Display Name</label>
            <input
              id="upName"
              type="text"
              value={uploadForm.displayName}
              onChange={(event) => setUploadForm((p) => ({ ...p, displayName: event.target.value }))}
              placeholder="Optional display name"
            />

            <label htmlFor="upCategory">Category</label>
            <select
              id="upCategory"
              value={uploadForm.category}
              onChange={(event) => setUploadForm((p) => ({ ...p, category: event.target.value }))}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <label htmlFor="upTag">Tag</label>
            <input
              id="upTag"
              type="text"
              value={uploadForm.tag}
              onChange={(event) => setUploadForm((p) => ({ ...p, tag: event.target.value }))}
            />

            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </button>
              <button className="primary-button" type="button" onClick={handleCreate} disabled={busyAction === "create"}>
                {busyAction === "create" ? "Processing..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditOpen && selectedDoc ? (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Edit Document</h3>
            <p>Update metadata. Replacing file creates a new on-chain hash version.</p>

            <label htmlFor="editName">Display Name</label>
            <input
              id="editName"
              type="text"
              value={editForm.displayName}
              onChange={(event) => setEditForm((p) => ({ ...p, displayName: event.target.value }))}
            />

            <label htmlFor="editCategory">Category</label>
            <select
              id="editCategory"
              value={editForm.category}
              onChange={(event) => setEditForm((p) => ({ ...p, category: event.target.value }))}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <label htmlFor="editTag">Tag</label>
            <input
              id="editTag"
              type="text"
              value={editForm.tag}
              onChange={(event) => setEditForm((p) => ({ ...p, tag: event.target.value }))}
            />

            <label htmlFor="replaceFile">Replace File (optional)</label>
            <input
              id="replaceFile"
              type="file"
              onChange={(event) => setEditForm((p) => ({ ...p, replaceFile: event.target.files && event.target.files[0] }))}
            />

            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setIsEditOpen(false)}>
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleUpdate}
                disabled={busyAction === `edit_${selectedDoc.id}`}
              >
                {busyAction === `edit_${selectedDoc.id}` ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewDoc ? (
        <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="modal-card preview-card" onClick={(event) => event.stopPropagation()}>
            <h3>Preview</h3>
            <p>{previewDoc.displayName || previewDoc.fileName}</p>
            {previewDoc.fileDataUrl ? (
              previewDoc.fileDataUrl.startsWith("data:image") ? (
                <img src={previewDoc.fileDataUrl} alt={previewDoc.fileName} className="preview-image" />
              ) : (
                <iframe title="file-preview" src={previewDoc.fileDataUrl} className="preview-frame" />
              )
            ) : (
              <a href={previewDoc.gatewayUrl} target="_blank" rel="noreferrer">
                Open from IPFS Gateway
              </a>
            )}
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setPreviewDoc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DocumentVault;
