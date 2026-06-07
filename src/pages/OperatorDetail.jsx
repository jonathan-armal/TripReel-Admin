import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  User,
  MapPin,
  Building2,
  Landmark,
  ShieldCheck,
  Package,
  Calendar,
  Wallet,
  Star,
  Tag,
  BarChart3,
  X,
} from "lucide-react";
import { adminOperatorsAPI } from "../services/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATE_LABELS = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  ACTIVE_FULL: "Approved",
};

const STATE_COLORS = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  SUSPENDED: "bg-orange-100 text-orange-700 border-orange-200",
  ACTIVE_FULL: "bg-green-100 text-green-700 border-green-200",
};

const DOCUMENT_LABELS = {
  governmentId: "Government ID (Aadhaar / Passport / DL)",
  selfieVerification: "Selfie Verification",
  tradeLicense: "Trade License",
  panCard: "PAN Card",
};

const DOCUMENT_PATHS = {
  governmentId: "governmentId",
  selfieVerification: "selfieVerification",
  tradeLicense: "tradeLicensePath",
  panCard: "panCardPath",
};

const DOC_STATUS_COLORS = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  REUPLOAD_REQUIRED: "bg-orange-50 text-orange-700 border-orange-200",
};

const BACKEND_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://tripreel-backend.onrender.com";

// ── Helpers ───────────────────────────────────────────────────────────────────
function StateBadge({ state }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${STATE_COLORS[state] || "bg-gray-100 text-gray-700 border-gray-200"}`}
    >
      {STATE_LABELS[state] || state}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-gray-800",
  bgColor = "bg-gray-50",
}) {
  return (
    <div className={`${bgColor} rounded-xl p-4 border border-gray-100`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function formatDate(ts) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isImageFile(path) {
  if (!path) return false;
  const lower = path.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp")
  );
}

// ── Image Lightbox ────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      <img
        src={src}
        alt="Document"
        className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OperatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [operator, setOperator] = useState(null);
  const [stats, setStats] = useState(null);
  const [operatorData, setOperatorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [note, setNote] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [docRemarks, setDocRemarks] = useState({});
  const [docLoading, setDocLoading] = useState("");

  const [lightboxSrc, setLightboxSrc] = useState(null);

  const [activeSection, setActiveSection] = useState("overview");
  const [bookingPage, setBookingPage] = useState(1);
  const bookingsPerPage = 5; // overview, documents, stats, history

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminOperatorsAPI.getById(id);
      setOperator(res.data.operator);
    } catch (err) {
      setFetchError(err.response?.data?.message || "Failed to load operator.");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await adminOperatorsAPI.getStats(id);
      setStats(res.data.stats);
      setOperatorData({
        packages: res.data.packages || [],
        batches: res.data.batches || [],
        recentBookings: res.data.recentBookings || [],
        coupons: res.data.coupons || [],
        recentReviews: res.data.recentReviews || [],
      });
    } catch {
      // Stats might not be available for all operators
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (
      operator?.onboardingState === "APPROVED" ||
      operator?.onboardingState === "ACTIVE_FULL"
    ) {
      loadStats();
    }
  }, [operator?.onboardingState]);

  const doTransition = async (newState) => {
    if (!note.trim() && (newState === "REJECTED" || newState === "SUSPENDED")) {
      setActionError("Please enter a reason before rejecting or suspending.");
      return;
    }
    setActionError("");
    setActionSuccess("");
    setActionLoading(newState);
    try {
      const res = await adminOperatorsAPI.transitionState(id, {
        newState,
        note: note.trim() || `Status changed to ${STATE_LABELS[newState]}`,
      });
      setOperator(res.data.operator);
      setNote("");
      setActionSuccess(`Status updated to "${STATE_LABELS[newState]}".`);
    } catch (err) {
      setActionError(err.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading("");
    }
  };

  const doDocStatus = async (key, status) => {
    const remark = (docRemarks[key] || "").trim();
    if ((status === "REJECTED" || status === "REUPLOAD_REQUIRED") && !remark) {
      setActionError(
        `Please enter a remark for ${DOCUMENT_LABELS[key]} before rejecting.`,
      );
      return;
    }
    setActionError("");
    setActionSuccess("");
    setDocLoading(`${key}:${status}`);
    try {
      const res = await adminOperatorsAPI.updateDocumentStatus(id, {
        key,
        status,
        remark,
      });
      setOperator(res.data.operator);
      setDocRemarks((prev) => ({ ...prev, [key]: "" }));
      setActionSuccess(
        `${DOCUMENT_LABELS[key]} marked as ${status.replace(/_/g, " ").toLowerCase()}.`,
      );
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to update document.",
      );
    } finally {
      setDocLoading("");
    }
  };

  // ── Loading states ────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (fetchError || !operator)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600">{fetchError || "Operator not found."}</p>
        <button
          onClick={() => navigate("/operators")}
          className="text-sm text-primary-600 hover:underline"
        >
          Back to list
        </button>
      </div>
    );

  const history = [...(operator.transitionHistory || [])].reverse();
  const isPending = operator.onboardingState === "PENDING_APPROVAL";
  const isApproved =
    operator.onboardingState === "APPROVED" ||
    operator.onboardingState === "ACTIVE_FULL";
  const isRejected = operator.onboardingState === "REJECTED";
  const isSuspended = operator.onboardingState === "SUSPENDED";

  const sectionTabs = [
    { id: "overview", label: "Overview" },
    { id: "documents", label: "Documents & Verification" },
    ...(isApproved || isSuspended
      ? [{ id: "stats", label: "Performance & Stats" }]
      : []),
    { id: "history", label: "History" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Lightbox */}
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/operators")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-0.5 flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {operator.businessName || operator.contactName}
            </h1>
            <StateBadge state={operator.onboardingState} />
          </div>
          <p className="text-sm text-gray-500">
            {operator.email} · Registered {formatDate(operator.createdAt)}
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Feedback */}
      {actionSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-sm text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" /> {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {actionError}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1">
        {sectionTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════ OVERVIEW SECTION ═══════════════════════════ */}
      {activeSection === "overview" && (
        <>
          {/* Business Profile */}
          <Section title="Business Profile" icon={Building2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoRow label="Contact Name" value={operator.contactName} />
              <InfoRow label="Business Name" value={operator.businessName} />
              <InfoRow label="Email" value={operator.email} />
              <InfoRow label="Phone" value={operator.phone} />
              <InfoRow
                label="Business Type"
                value={operator.businessType?.replace(/_/g, " ") || "—"}
              />
              <InfoRow label="GST Number" value={operator.gstNumber} />
            </div>
          </Section>

          {/* Location */}
          <Section title="Location" icon={MapPin}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoRow label="Country" value={operator.country} />
              <InfoRow label="State" value={operator.state} />
              <InfoRow label="City" value={operator.city} />
              <div className="sm:col-span-3">
                <InfoRow
                  label="Operating Destinations"
                  value={(operator.mainOperatingDestinations || []).join(", ")}
                />
              </div>
            </div>
          </Section>

          {/* Bank Details */}
          <Section title="Bank Details" icon={Landmark}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                label="Account Holder"
                value={operator.accountHolderName}
              />
              <InfoRow label="Bank Name" value={operator.bankName} />
              <InfoRow label="Account Number" value={operator.accountNumber} />
              <InfoRow label="IFSC Code" value={operator.ifscCode} />
              <InfoRow label="UPI ID" value={operator.upiId} />
            </div>
          </Section>

          {/* Final Decision */}
          {(isPending || isApproved || isRejected || isSuspended) && (
            <Section title="Admin Action" icon={ThumbsUp}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Note{" "}
                  <span className="text-gray-400 font-normal">
                    (required for rejection / suspension)
                  </span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setActionError("");
                  }}
                  rows={3}
                  placeholder="Add a note for the operator…"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {!isApproved && (
                  <button
                    onClick={() => doTransition("APPROVED")}
                    disabled={!!actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-600 text-white disabled:opacity-60 transition-colors"
                  >
                    {actionLoading === "APPROVED" ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ThumbsUp className="w-4 h-4" />
                    )}
                    Approve Operator
                  </button>
                )}
                {!isRejected && !isApproved && (
                  <button
                    onClick={() => doTransition("REJECTED")}
                    disabled={!!actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 transition-colors"
                  >
                    {actionLoading === "REJECTED" ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject Application
                  </button>
                )}
                {isApproved && !isSuspended && (
                  <button
                    onClick={() => doTransition("SUSPENDED")}
                    disabled={!!actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60 transition-colors"
                  >
                    {actionLoading === "SUSPENDED" ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Suspend Account
                  </button>
                )}
                {isSuspended && (
                  <button
                    onClick={() => doTransition("APPROVED")}
                    disabled={!!actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-600 text-white disabled:opacity-60 transition-colors"
                  >
                    {actionLoading === "APPROVED" ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Reinstate Account
                  </button>
                )}
              </div>
            </Section>
          )}
        </>
      )}

      {/* ═══════════════════════ DOCUMENTS SECTION ═══════════════════════════ */}
      {activeSection === "documents" && (
        <Section title="Document Review" icon={ShieldCheck}>
          <p className="text-sm text-gray-500 mb-4">
            Review each document individually. Click thumbnails to view full
            size. Add a remark before rejecting or requesting re-upload.
          </p>
          <div className="space-y-5">
            {Object.entries(DOCUMENT_LABELS).map(([key, label]) => {
              const filePath = operator[DOCUMENT_PATHS[key]];
              const docStatus = operator.documentStatus?.[key];
              const status = docStatus?.status || (filePath ? "PENDING" : null);
              const remark = docStatus?.remark;
              const isDocLoading = (s) => docLoading === `${key}:${s}`;
              const fullUrl = filePath
                ? filePath.startsWith("http")
                  ? filePath
                  : `${BACKEND_URL}${filePath}`
                : null;
              const isImage = isImageFile(filePath);

              return (
                <div
                  key={key}
                  className={`rounded-xl border p-5 ${
                    filePath
                      ? "border-gray-200 bg-gray-50"
                      : "border-dashed border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <FileText
                        className={`w-4 h-4 flex-shrink-0 ${filePath ? "text-teal-500" : "text-gray-300"}`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {label}
                        </p>
                        {status && (
                          <span
                            className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${DOC_STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                          >
                            {status.replace(/_/g, " ")}
                          </span>
                        )}
                        {remark && (
                          <p className="text-xs text-gray-500 mt-1">
                            Admin note: {remark}
                          </p>
                        )}
                      </div>
                    </div>
                    {fullUrl && (
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
                      </a>
                    )}
                  </div>

                  {/* Document thumbnail */}
                  {fullUrl && (
                    <div className="mb-4">
                      {isImage ? (
                        <button
                          onClick={() => setLightboxSrc(fullUrl)}
                          className="block group"
                        >
                          <img
                            src={fullUrl}
                            alt={label}
                            className="w-32 h-32 object-cover rounded-xl border border-gray-200 group-hover:ring-2 group-hover:ring-teal-400 transition-all cursor-zoom-in"
                          />
                          <span className="text-xs text-teal-600 mt-1 inline-block group-hover:underline">
                            Click to enlarge
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 w-fit">
                          <FileText className="w-8 h-8 text-red-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              PDF Document
                            </p>
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-teal-600 hover:underline"
                            >
                              Open PDF →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!filePath && (
                    <p className="text-xs text-gray-400 italic mb-3">
                      Not uploaded
                    </p>
                  )}

                  {filePath && status !== "APPROVED" && (
                    <>
                      <input
                        value={docRemarks[key] || ""}
                        onChange={(e) =>
                          setDocRemarks((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder={`Remark for ${label} (required for reject/re-upload)`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 bg-white mb-3"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => doDocStatus(key, "APPROVED")}
                          disabled={!!docLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 transition-colors"
                        >
                          {isDocLoading("APPROVED") ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ThumbsUp className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => doDocStatus(key, "REUPLOAD_REQUIRED")}
                          disabled={!!docLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors"
                        >
                          {isDocLoading("REUPLOAD_REQUIRED") ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Request Re-upload
                        </button>
                        <button
                          onClick={() => doDocStatus(key, "REJECTED")}
                          disabled={!!docLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
                        >
                          {isDocLoading("REJECTED") ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ThumbsDown className="w-3.5 h-3.5" />
                          )}
                          Reject
                        </button>
                      </div>
                    </>
                  )}

                  {filePath && status === "APPROVED" && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" /> Document approved
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ═══════════════════════ STATS SECTION ═══════════════════════════════ */}
      {activeSection === "stats" && (
        <>
          {statsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={Package}
                  label="Total Packages"
                  value={stats.packageCount}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                />
                <StatCard
                  icon={Calendar}
                  label="Total Batches"
                  value={stats.batchCount}
                  color="text-purple-600"
                  bgColor="bg-purple-50"
                />
                <StatCard
                  icon={BarChart3}
                  label="Total Bookings"
                  value={stats.bookingCount}
                  color="text-teal-600"
                  bgColor="bg-teal-50"
                />
                <StatCard
                  icon={CheckCircle}
                  label="Completed"
                  value={stats.completedBookings}
                  color="text-green-600"
                  bgColor="bg-green-50"
                />
                <StatCard
                  icon={Wallet}
                  label="Total Revenue"
                  value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
                  color="text-emerald-600"
                  bgColor="bg-emerald-50"
                />
                <StatCard
                  icon={Tag}
                  label="Coupons"
                  value={stats.couponCount}
                  color="text-orange-600"
                  bgColor="bg-orange-50"
                />
                <StatCard
                  icon={Star}
                  label="Reviews"
                  value={stats.reviewCount}
                  color="text-amber-600"
                  bgColor="bg-amber-50"
                />
                <StatCard
                  icon={Star}
                  label="Avg Rating"
                  value={stats.avgRating > 0 ? `${stats.avgRating} ★` : "N/A"}
                  color="text-yellow-600"
                  bgColor="bg-yellow-50"
                />
              </div>

              {/* Packages List */}
              {operatorData?.packages?.length > 0 && (
                <Section
                  title={`Packages (${operatorData.packages.length})`}
                  icon={Package}
                >
                  <div className="space-y-3">
                    {operatorData.packages.map((pkg) => (
                      <div
                        key={pkg._id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        {pkg.image_url && (
                          <img
                            src={
                              pkg.image_url.startsWith("http")
                                ? pkg.image_url
                                : `${BACKEND_URL}${pkg.image_url}`
                            }
                            alt=""
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {pkg.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {pkg.location} · {pkg.durationDays}D/
                            {pkg.durationNights}N
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-800">
                            ₹{pkg.price?.toLocaleString("en-IN")}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${pkg.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {pkg.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Batches */}
              {operatorData?.batches?.length > 0 && (
                <Section
                  title={`Batches (${operatorData.batches.length})`}
                  icon={Calendar}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                            Package
                          </th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                            Label
                          </th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                            Dates
                          </th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                            Price
                          </th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                            Seats
                          </th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                            Bookings
                          </th>
                          <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {operatorData.batches.map((batch) => {
                          const startDate = batch.startDate
                            ? new Date(batch.startDate)
                            : null;
                          const endDate = batch.endDate
                            ? new Date(batch.endDate)
                            : null;
                          const now = new Date();
                          const isUpcoming = startDate && startDate > now;
                          const isOngoing =
                            startDate &&
                            endDate &&
                            startDate <= now &&
                            endDate >= now;
                          const isCompleted = endDate && endDate < now;
                          const seatsFilled = batch.bookedSeats || 0;
                          const totalSeats = batch.totalSeats || 0;
                          const fillPercent =
                            totalSeats > 0
                              ? Math.round((seatsFilled / totalSeats) * 100)
                              : 0;

                          return (
                            <tr
                              key={batch._id}
                              className={!batch.isActive ? "opacity-50" : ""}
                            >
                              <td className="py-2.5 px-2 text-gray-800 font-medium text-xs truncate max-w-[120px]">
                                {batch.packageTitle || "—"}
                              </td>
                              <td className="py-2.5 px-2 text-gray-600 text-xs">
                                {batch.label || "—"}
                              </td>
                              <td className="py-2.5 px-2 text-gray-600 text-xs whitespace-nowrap">
                                {startDate?.toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                                {" → "}
                                {endDate?.toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </td>
                              <td className="py-2.5 px-2 text-gray-800 font-medium text-xs">
                                ₹{batch.adultPrice?.toLocaleString("en-IN")}
                                {batch.childPrice > 0 && (
                                  <span className="text-gray-400">
                                    {" "}
                                    / ₹
                                    {batch.childPrice?.toLocaleString(
                                      "en-IN",
                                    )}{" "}
                                    child
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${fillPercent >= 90 ? "bg-red-400" : fillPercent >= 50 ? "bg-amber-400" : "bg-green-400"}`}
                                      style={{ width: `${fillPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    {seatsFilled}/{totalSeats}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-xs font-medium text-teal-700">
                                {batch.bookingCount || 0}
                              </td>
                              <td className="py-2.5 px-2">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    !batch.isActive
                                      ? "bg-gray-100 text-gray-500"
                                      : isCompleted
                                        ? "bg-gray-100 text-gray-600"
                                        : isOngoing
                                          ? "bg-blue-100 text-blue-700"
                                          : isUpcoming
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {!batch.isActive
                                    ? "Inactive"
                                    : isCompleted
                                      ? "Completed"
                                      : isOngoing
                                        ? "Ongoing"
                                        : isUpcoming
                                          ? "Upcoming"
                                          : "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}

              {/* Bookings */}
              {operatorData?.recentBookings?.length > 0 &&
                (() => {
                  const allBookings = operatorData.recentBookings;
                  const totalBookingPages = Math.ceil(
                    allBookings.length / bookingsPerPage,
                  );
                  const paginatedBookings = allBookings.slice(
                    (bookingPage - 1) * bookingsPerPage,
                    bookingPage * bookingsPerPage,
                  );
                  return (
                    <Section
                      title={`Bookings (${allBookings.length} total)`}
                      icon={BarChart3}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                                Package
                              </th>
                              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                                Batch
                              </th>
                              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                                Seats
                              </th>
                              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                                Amount
                              </th>
                              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                                Operator Gets
                              </th>
                              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                                Status
                              </th>
                              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedBookings.map((b) => {
                              const batch = operatorData?.batches?.find(
                                (bt) =>
                                  bt._id ===
                                  (b.batchId?.toString?.() || b.batchId),
                              );
                              return (
                                <tr key={b._id}>
                                  <td className="py-2 px-2 text-gray-800 font-medium truncate max-w-[120px]">
                                    {b.snapshot?.packageTitle || "—"}
                                  </td>
                                  <td className="py-2 px-2 text-xs text-gray-600">
                                    {batch?.label ||
                                      b.snapshot?.batchLabel ||
                                      "—"}
                                  </td>
                                  <td className="py-2 px-2 text-gray-600">
                                    {b.seats || b.travelers?.length || 1} pax
                                  </td>
                                  <td className="py-2 px-2 text-gray-800 font-medium">
                                    ₹{b.totalAmount?.toLocaleString("en-IN")}
                                  </td>
                                  <td className="py-2 px-2 text-green-700 font-medium">
                                    ₹{b.operatorAmount?.toLocaleString("en-IN")}
                                  </td>
                                  <td className="py-2 px-2">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        b.status === "CONFIRMED"
                                          ? "bg-blue-100 text-blue-700"
                                          : b.status === "COMPLETED"
                                            ? "bg-green-100 text-green-700"
                                            : b.status === "CANCELLED"
                                              ? "bg-red-100 text-red-700"
                                              : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {b.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-gray-500 text-xs">
                                    {new Date(b.createdAt).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {totalBookingPages > 1 && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Page {bookingPage} of {totalBookingPages}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setBookingPage((p) => Math.max(1, p - 1))
                              }
                              disabled={bookingPage === 1}
                              className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              ← Prev
                            </button>
                            <button
                              onClick={() =>
                                setBookingPage((p) =>
                                  Math.min(totalBookingPages, p + 1),
                                )
                              }
                              disabled={bookingPage === totalBookingPages}
                              className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              Next →
                            </button>
                          </div>
                        </div>
                      )}
                    </Section>
                  );
                })()}

              {/* Coupons */}
              {operatorData?.coupons?.length > 0 && (
                <Section
                  title={`Coupons (${operatorData.coupons.length})`}
                  icon={Tag}
                >
                  <div className="space-y-2">
                    {operatorData.coupons.map((c) => (
                      <div
                        key={c._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm font-mono font-bold">
                            {c.code}
                          </span>
                          <div>
                            <p className="text-sm text-gray-700">
                              {c.type === "percentage"
                                ? `${c.value}% off`
                                : `₹${c.value} off`}
                              {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
                            </p>
                            <p className="text-xs text-gray-400">
                              Used {c.usedCount || 0} times
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {c.isActive ? "Active" : "Expired"}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Reviews */}
              {operatorData?.recentReviews?.length > 0 && (
                <Section
                  title={`Reviews (${stats.reviewCount} total, ${stats.avgRating}★ avg)`}
                  icon={Star}
                >
                  <div className="space-y-3">
                    {operatorData.recentReviews.map((r) => (
                      <div
                        key={r._id}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">
                              {r.userName}
                            </span>
                            <span className="text-xs text-gray-400">
                              on {r.packageTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-gray-600">{r.comment}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                No stats available yet. This operator may not have any activity.
              </p>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════ HISTORY SECTION ═══════════════════════════ */}
      {activeSection === "history" && (
        <Section title="Review History" icon={Clock}>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No history yet.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((entry, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                        entry.toState === "APPROVED"
                          ? "bg-green-400"
                          : entry.toState === "REJECTED" ||
                              entry.toState === "SUSPENDED"
                            ? "bg-red-400"
                            : "bg-amber-400"
                      }`}
                    />
                    {i < history.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-4 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <StateBadge state={entry.toState} />
                      <span className="text-xs text-gray-400">
                        from{" "}
                        <span className="font-medium text-gray-500">
                          {STATE_LABELS[entry.fromState] || entry.fromState}
                        </span>
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-1">
                        {entry.note}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
