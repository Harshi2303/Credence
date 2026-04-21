import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { 
  Box, 
  Typography, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  Paper,
  IconButton,
  Chip,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
// Icons
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import DriveEtaIcon from "@mui/icons-material/DriveEta";
import PublicIcon from "@mui/icons-material/Public";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import HistoryIcon from "@mui/icons-material/History";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LaunchIcon from "@mui/icons-material/Launch";
import ShareIcon from "@mui/icons-material/Share";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BlockIcon from "@mui/icons-material/Block";
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LabelIcon from "@mui/icons-material/Label";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";

const DOCUMENTS_KEY = "credence_documents";
const CATEGORIES = ["Academic", "Financial", "Identity", "Healthcare", "Aadhaar Card", "PAN Card", "Voter ID", "Driving License", "Passport"];

const MenuProps = {
  PaperProps: {
    style: {
      backgroundColor: 'rgba(15, 10, 25, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
    },
  },
};

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
          (doc.category || "").toLowerCase().includes(q) ||
          (doc.tag || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [documents, searchTerm, categoryFilter, statusFilter]);

  const groupedDocuments = useMemo(() => {
    const map = {};
    for (const category of CATEGORIES) map[category] = [];
    for (const doc of filteredDocuments) {
      // Find exact match or default to Identity for specific documents
      let key = "Identity";
      if (CATEGORIES.includes(doc.category)) {
        key = doc.category;
      } else if (doc.category === "aadhar") {
        key = "Aadhaar Card";
      } else if (doc.category === "pan") {
        key = "PAN Card";
      } else if (doc.category === "voter") {
        key = "Voter ID";
      } else if (doc.category === "dl") {
        key = "Driving License";
      } else if (doc.category === "passport") {
        key = "Passport";
      }
      
      if (map[key]) {
        map[key].push(doc);
      } else {
        map["Identity"].push(doc);
      }
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
      // Sync with Backend for Verification Registry
      const formData = new FormData();
      formData.append("document", uploadForm.file);
      formData.append("category", uploadForm.category);
      await axios.post("http://localhost:5000/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

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
    <Box className="vault-root">
      <Box sx={{ mb: 6, display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", pb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <IconButton 
            onClick={onBack} 
            sx={{ 
              bgcolor: "rgba(255,255,255,0.05)", 
              border: "1px solid rgba(255,255,255,0.1)", 
              color: "#fff",
              p: 1.5,
              "&:hover": { bgcolor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" } 
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h2" className="gradient-text" sx={{ letterSpacing: 2, fontSize: { xs: "1.8rem", md: "2.4rem" }, fontFamily: 'Space Grotesk' }}>
              DOCUMENT // VAULT
            </Typography>
            <Typography variant="body2" sx={{ color: "#38bdf8", mt: 0.2, letterSpacing: 1.5, fontWeight: 700, fontSize: "0.75rem", fontFamily: "'Fira Code', monospace" }}>
              WALLET: {walletDisplay} // ENCRYPTED_STORAGE
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ 
        display: "grid", 
        gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr 1fr auto" }, 
        gap: 2, 
        mb: 6, 
        bgcolor: "rgba(255,255,255,0.03)", 
        p: 2, 
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)"
      }}>
        <TextField
          placeholder="Search by name, file, or tag..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          sx={{ 
            "& .MuiOutlinedInput-root": { color: "#fff", borderRadius: 3, bgcolor: "rgba(0,0,0,0.2)" },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" }
          }}
        />
        <FormControl size="small">
          <Select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            MenuProps={MenuProps}
            sx={{ color: "#fff", borderRadius: 3, bgcolor: "rgba(0,0,0,0.2)", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
          >
            <MenuItem value="All Categories">All Categories</MenuItem>
            {CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small">
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            MenuProps={MenuProps}
            sx={{ color: "#fff", borderRadius: 3, bgcolor: "rgba(0,0,0,0.2)", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
          >
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button 
          variant="contained" 
          onClick={() => setIsUploadOpen(true)}
          sx={{ 
            px: 4, 
            borderRadius: 3, 
            fontWeight: 800, 
            fontFamily: "Space Grotesk",
            background: "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)"
          }}
        >
          NEW UPLOAD
        </Button>
      </Box>

      {message ? <p className="status-message">{message}</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      {CATEGORIES.map((category) => {
        const hasDocs = groupedDocuments[category].length > 0;
        
        // Always hide empty categories for a cleaner "Vault" feel
        if (!hasDocs) return null;

        return (
          <section key={category} className="vault-section" style={{ marginBottom: '32px' }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Typography variant="h4" sx={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.5rem" }}>{category}</Typography>
              <Box sx={{ flexGrow: 1, height: "1px", bgcolor: "rgba(255,255,255,0.05)" }} />
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>{groupedDocuments[category].length} FILES</Typography>
            </Box>
            <div className="vault-grid">
              {!hasDocs ? (
                <div className="empty-card">No documents found.</div>
              ) : (
                 groupedDocuments[category].map((doc) => {
                 const hasTx = Boolean(doc.txHash);
                 const chain = doc.chainId || networkId;
                 const explorerUrl = hasTx ? `${getExplorerBase(chain)}/tx/${doc.txHash}` : "";
                 return (
                   <Paper 
                    key={doc.id} 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      mb: 2, 
                      borderRadius: 4, 
                      background: "rgba(15, 10, 25, 0.4)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      transition: "all 0.3s",
                      "&:hover": { background: "rgba(15, 10, 25, 0.6)", borderColor: "#8b5cf660" }
                    }}
                   >
                    <Grid container spacing={3} alignItems="center">
                      {/* Column 1: Document Identity */}
                      <Grid item xs={12} md={3}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                            <DescriptionIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", fontFamily: "Space Grotesk", lineHeight: 1.2 }}>
                              {doc.displayName || doc.fileName}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                              <Chip label={doc.status || "Active"} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 900, bgcolor: "rgba(52, 211, 153, 0.1)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.2)" }} />
                              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>v{doc.version || 1}.0</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Column 2: Metadata Details */}
                      <Grid item xs={12} md={4}>
                         <Grid container spacing={2}>
                            <Grid item xs={6}>
                               <Typography sx={{ color: "#64748b", fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase" }}>Stored At</Typography>
                               <Typography sx={{ color: "#cbd5e1", fontSize: "0.85rem", fontWeight: 600 }}>{formatDate(doc.createdAt).split(',')[0]}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                               <Typography sx={{ color: "#64748b", fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase" }}>Security Tag</Typography>
                               <Typography sx={{ color: "#cbd5e1", fontSize: "0.85rem", fontWeight: 600 }}>{doc.tag || "None"}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                               <Box sx={{ display: "flex", justifyContent: "space-between", bgcolor: "rgba(0,0,0,0.2)", p: 0.8, borderRadius: 2, border: "1px solid rgba(255,255,255,0.03)" }}>
                                  <Typography sx={{ color: "#94a3b8", fontSize: "0.65rem", fontFamily: "Fira Code" }}>CID: {toShort(doc.cid, 10, 8)}</Typography>
                                  <IconButton size="small" sx={{ p: 0, color: "#64748b" }} onClick={() => { navigator.clipboard.writeText(doc.cid); setMessage("CID Copied"); }}>
                                    <ContentCopyIcon sx={{ fontSize: 12 }} />
                                  </IconButton>
                               </Box>
                            </Grid>
                         </Grid>
                      </Grid>

                      {/* Column 3: Actions */}
                      <Grid item xs={12} md={5}>
                         <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: { xs: "center", md: "flex-end"} }}>
                            <Button 
                              size="small" 
                              startIcon={<VisibilityIcon />} 
                              onClick={() => openPreview(doc)}
                              sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2, fontSize: "0.7rem", fontWeight: 800, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                            >PREVIEW</Button>
                            
                            <Button 
                              size="small" 
                              startIcon={<EditIcon />} 
                              onClick={() => openEditModal(doc)}
                              sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2, fontSize: "0.7rem", fontWeight: 800, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                            >EDIT</Button>

                            <Button 
                              size="small" 
                              startIcon={<LaunchIcon />} 
                              onClick={() => hasTx && window.open(explorerUrl, "_blank")}
                              disabled={!hasTx}
                              sx={{ color: "#3b82f6", bgcolor: "rgba(59, 130, 246, 0.1)", borderRadius: 2, fontSize: "0.7rem", fontWeight: 800 }}
                            >EXPLORER</Button>

                            <Button 
                              size="small" 
                              variant="contained"
                              startIcon={<ShareIcon />} 
                              onClick={() => handleShare(doc)}
                              disabled={shareBusyId === doc.id}
                              sx={{ bgcolor: "#8b5cf6", borderRadius: 2, fontSize: "0.7rem", fontWeight: 800, "&:hover": { bgcolor: "#7c3aed"} }}
                            >{shareBusyId === doc.id ? "..." : "SHARE"}</Button>

                            <IconButton 
                              size="small" 
                              onClick={() => handleRevoke(doc)}
                              disabled={busyAction === `revoke_${doc.id}` || doc.status === "Revoked"}
                              sx={{ color: "#fca5a5", bgcolor: "rgba(239, 68, 68, 0.05)", borderRadius: 2 }}
                            ><BlockIcon sx={{ fontSize: 20 }} /></IconButton>

                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteLocal(doc)}
                              disabled={busyAction === `delete_${doc.id}`}
                              sx={{ color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.05)", borderRadius: 2 }}
                            ><DeleteOutlineIcon sx={{ fontSize: 20 }} /></IconButton>
                         </Box>
                      </Grid>

                      {/* Audit Trail Row (Full width) */}
                      <Grid item xs={12}>
                         <details className="audit-trail-simple">
                            <summary style={{ color: "#94a3b8", fontSize: "0.65rem", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                              <HistoryIcon sx={{ fontSize: 14 }} /> SYSTEM AUDIT LOG ({(doc.auditTrail || []).length})
                            </summary>
                            <Box sx={{ mt: 1, p: 2, bgcolor: "rgba(0,0,0,0.3)", borderRadius: 2 }}>
                               {(doc.auditTrail || []).slice().reverse().map((item, idx) => (
                                 <Typography key={idx} sx={{ color: "#94a3b8", fontSize: "0.65rem", fontFamily: "Fira Code", mb: 0.5 }}>
                                    <span style={{ color: "#fff"}}>{item.action}</span> {"-"} {formatDate(item.at)}
                                 </Typography>
                               ))}
                            </Box>
                         </details>
                      </Grid>
                    </Grid>
                   </Paper>
                 );
               })
             )}
          </div>
          </section>
        );
      })}

      {/* Portaled Modals using MUI Dialog */}
      <Dialog 
        open={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(15, 10, 25, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: 6,
            color: "#fff",
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "Space Grotesk", fontWeight: 800, fontSize: "1.8rem", background: "linear-gradient(90deg, #fff 0%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          NEW UPLOAD
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#94a3b8", mb: 3 }}>Securing documents via SHA-256 hash & Decentralized IPFS Storage.</Typography>
          
          <Box sx={{ 
            p: 4, 
            border: "2px dashed rgba(139, 92, 246, 0.3)", 
            borderRadius: 4, 
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.3s",
            mb: 4,
            bgcolor: uploadForm.file ? "rgba(16, 185, 129, 0.05)" : "rgba(139, 92, 246, 0.03)",
            borderColor: uploadForm.file ? "#10b981" : "rgba(139, 92, 246, 0.3)",
            "&:hover": { bgcolor: "rgba(139, 92, 246, 0.08)", borderColor: "#8b5cf6" }
          }} onClick={() => document.getElementById('upFile').click()}>
            <CloudUploadIcon sx={{ fontSize: 64, color: uploadForm.file ? "#10b981" : "#8b5cf6", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>{uploadForm.file ? uploadForm.file.name : "DROP FILE OR CLICK TO BROWSE"}</Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>Supported: PNG, JPG, PDF (Max 10MB)</Typography>
            <input
              id="upFile"
              type="file"
              style={{ display: "none" }}
              onChange={(event) => setUploadForm((p) => ({ ...p, file: event.target.files && event.target.files[0] }))}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography variant="caption" sx={{ color: "#8b5cf6", mb: 1, fontWeight: 900 }}>DISPLAY NAME</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="e.g. Annual Report"
                  value={uploadForm.displayName}
                  onChange={(e) => setUploadForm(p => ({ ...p, displayName: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(0,0,0,0.2)", borderRadius: 3 }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography variant="caption" sx={{ color: "#8b5cf6", mb: 1, fontWeight: 900 }}>CATEGORY</Typography>
                <Select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm(p => ({ ...p, category: e.target.value }))}
                  MenuProps={MenuProps}
                  size="small"
                  sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.2)", borderRadius: 3, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
                >
                  {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Typography variant="caption" sx={{ color: "#8b5cf6", mb: 1, fontWeight: 900 }}>SECURITY TAG // OPTIONAL</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="e.g. Confidential"
                  value={uploadForm.tag}
                  onChange={(e) => setUploadForm(p => ({ ...p, tag: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(0,0,0,0.2)", borderRadius: 3 }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
                />
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 4 }}>
          <Button onClick={() => setIsUploadOpen(false)} sx={{ color: "#94a3b8", fontWeight: 800 }}>CANCEL</Button>
          <Button 
            variant="contained" 
            onClick={handleCreate} 
            disabled={busyAction === "create"}
            sx={{ 
              borderRadius: 3, 
              px: 6, 
              py: 1.5,
              fontWeight: 800, 
              background: "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)",
              boxShadow: "0 10px 30px rgba(139, 92, 246, 0.4)"
            }}
          >
            {busyAction === "create" ? "ENCRYPTING..." : "INITIALIZE UPLOAD"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={isEditOpen && Boolean(selectedDoc)} 
        onClose={() => setIsEditOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(15, 10, 25, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 6,
            color: "#fff",
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "Space Grotesk", fontWeight: 800, fontSize: "1.8rem" }}>
          EDIT RECORD
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#94a3b8", mb: 4 }}>Updating metadata for record ID: {selectedDoc?.id}</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
               <FormControl fullWidth>
                <Typography variant="caption" sx={{ color: "#8b5cf6", mb: 1, fontWeight: 900 }}>DISPLAY NAME</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(p => ({ ...p, displayName: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(0,0,0,0.2)", borderRadius: 3 }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography variant="caption" sx={{ color: "#8b5cf6", mb: 1, fontWeight: 900 }}>CATEGORY</Typography>
                <Select
                  value={editForm.category}
                  onChange={(e) => setEditForm(p => ({ ...p, category: e.target.value }))}
                  MenuProps={MenuProps}
                  size="small"
                  sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.2)", borderRadius: 3, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
                >
                  {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
               <FormControl fullWidth>
                <Typography variant="caption" sx={{ color: "#8b5cf6", mb: 1, fontWeight: 900 }}>TAG</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={editForm.tag}
                  onChange={(e) => setEditForm(p => ({ ...p, tag: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(0,0,0,0.2)", borderRadius: 3 }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
                />
              </FormControl>
            </Grid>
             <Grid item xs={12}>
               <Typography variant="caption" sx={{ color: "#fbbf24", mb: 1, display: "block", fontWeight: 900 }}>VERSION CONTROL // REPLACE FILE</Typography>
               <Box sx={{ 
                  p: 3, 
                  border: "1px dashed rgba(251, 191, 36, 0.4)", 
                  borderRadius: 4, 
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(251, 191, 36, 0.05)" }
                }} onClick={() => document.getElementById('replaceFileEdit').click()}>
                 <Typography variant="body1" sx={{ color: "#fff", fontWeight: 700 }}>{editForm.replaceFile ? editForm.replaceFile.name : "Select new file to create new version"}</Typography>
                 <input
                  id="replaceFileEdit"
                  type="file"
                  style={{ display: "none" }}
                  onChange={(event) => setEditForm((p) => ({ ...p, replaceFile: event.target.files && event.target.files[0] }))}
                />
               </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 4 }}>
          <Button onClick={() => setIsEditOpen(false)} sx={{ color: "#94a3b8", fontWeight: 800 }}>CANCEL</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdate} 
            disabled={busyAction === `edit_${selectedDoc?.id}`}
            sx={{ 
              borderRadius: 3, 
              px: 6, 
              py: 1.5,
              fontWeight: 800, 
              background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 10px 30px rgba(245, 158, 11, 0.3)"
            }}
          >
            {busyAction === `edit_${selectedDoc?.id}` ? "SAVING..." : "COMMIT CHANGES"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={Boolean(previewDoc)} 
        onClose={() => setPreviewDoc(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(15, 10, 25, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 6,
            color: "#fff",
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "Space Grotesk", fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.1)", mb: 2 }}>
          {previewDoc?.displayName || previewDoc?.fileName}
        </DialogTitle>
        <DialogContent>
          {previewDoc?.fileDataUrl ? (
            previewDoc.fileDataUrl.startsWith("data:image") ? (
              <img src={previewDoc.fileDataUrl} alt={previewDoc.fileName} style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }} />
            ) : (
              <iframe title="file-preview" src={previewDoc.fileDataUrl} style={{ width: "100%", minHeight: "75vh", borderRadius: 12, border: "none", background: "#fff" }} />
            )
          ) : (
             <Box sx={{ p: 10, textAlign: "center" }}>
                <Typography variant="h6" sx={{ color: "#94a3b8", mb: 3 }}>Document hosted on external gateway</Typography>
                <Button variant="outlined" color="primary" href={previewDoc?.gatewayUrl} target="_blank" rel="noreferrer">
                  OPEN IN BLOCKCHAIN EXPLORER
                </Button>
             </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewDoc(null)} variant="contained" sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
            CLOSE PREVIEW
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DocumentVault;
