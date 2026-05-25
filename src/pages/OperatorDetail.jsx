import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Shield,
  Ban,
} from "lucide-react";
import { adminOperatorsAPI } from "../services/api";

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_STATES = [
  "DRAFT",
  "DOCUMENTS_SUBMITTED",
  "KYC_VERIFICATION",
  "COMMERCIAL_CONTRACT_SENT",
  "CONTRACT_SIGNED",
  "RAZORPAY_LINKED_ACCOUNT_CREATED",
  "TRAINING_COMPLETED",
  "TEST_LISTING_PUBLISHED",
  "ACTIVE_PROBATION",
  "ACTIVE_FULL",
  "SUSPENDED",
  "OFFBOARDED",
];

const STATE_LABELS = {
  DRAFT: "Draft",
  DOCUMENTS_SUBMITTED: "Documents Submitted",
  KYC_VERIFICATION: "KYC Verification",
  COMMERCIAL_CONTRACT_SENT: "Contract Sent",
  CONTRACT_SIGNED: "Contract Signed",
  RAZORPAY_LINKED_ACCOUNT_CREATED: "Payment Account Created",
  TRAINING_COMPLETED: "Training Completed",
  TEST_LISTING_PUBLISHED: "Test Listing Published",
  ACTIVE_PROBATION: "Active (Probation)",
  ACTIVE_FULL: "Active",
  SUSPENDED: "Suspended",
  OFFBOARDED: "Offboarded",
};

const STATE_COLORS = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  DOCUMENTS_SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
  KYC_VERIFICATION: "bg-yellow-100 text-yellow-700 border-yellow-200",
  COMMERCIAL_CONTRACT_SENT: "bg-orange-100 text-orange-700 border-orange-200",
  CONTRACT_SIGNED: "bg-purple-100 text-purple-700 border-purple-200",
  RAZORPAY_LINKED_ACCOUNT_CREATED:
    "bg-indigo-100 text-indigo-700 border-indigo-200",
  TRAINING_COMPLETED: "bg-cyan-100 text-cyan-700 border-cyan-200",
  TEST_LISTING_PUBLISHED: "bg-teal-100 text-teal-700 border-teal-200",
  ACTIVE_PROBATION: "bg-lime-100 text-lime-700 border-lime-200",
  ACTIVE_FULL: "bg-green-100 text-green-700 border-green-200",
  SUSPENDED: "bg-red-100 text-red-700 border-red-200",
  OFFBOARDED: "bg-slate-100 text-slate-700 border-slate-200",
};

const DOCUMENT_LABELS = {
  gstCertificate: "GST Registration Certificate",
  pan: "PAN Card",
  incorporationCertificate: "Certificate of Incorporation",
  bankProof: "Bank Account Proof",
  tan: "TAN Certificate",
  industryAssociationCertificate: "Industry Association Certificate",
  liabilityInsuranceCertificate: "Liability Insurance Certificate",
  authorizedSignatoryIdProof: "Authorized Signatory ID Proof",
  tourismTravelLicense: "Tourism / Travel License",
  officeAddressProof: "Office Address Proof",
  companyLogo: "Company Logo",
  coverBanner: "Cover Banner",
};

const DOC_STATUS_LABELS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REUPLOAD_REQUIRED: "Re-upload",
};

const DOC_STATUS_COLORS = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  REUPLOAD_REQUIRED: "bg-orange-50 text-orange-700 border-orange-200",
};

// Quick-action definitions: shown as prominent buttons based on current state
const QUICK_ACTIONS = {
  DOCUMENTS_SUBMITTED: [
    {
      label: "Start KYC Review",
      toState: "KYC_VERIFICATION",
      icon: Shield,
      style: "bg-yellow-500 hover:bg-yellow-600 text-white",
      defaultNote: "Starting KYC verification process.",
    },
    {
      label: "Reject Application",
      toState: "OFFBOARDED",
      icon: XCircle,
      style: "bg-red-500 hover:bg-red-600 text-white",
      defaultNote: "",
      requireNote: true,
    },
  ],
  KYC_VERIFICATION: [
    {
      label: "Send Contract",
      toState: "COMMERCIAL_CONTRACT_SENT",
      icon: ThumbsUp,
      style: "bg-orange-500 hover:bg-orange-600 text-white",
      defaultNote: "KYC verified. Commercial contract sent to operator.",
    },
    {
      label: "Reject — KYC Failed",
      toState: "OFFBOARDED",
      icon: ThumbsDown,
      style: "bg-red-500 hover:bg-red-600 text-white",
      defaultNote: "",
      requireNote: true,
    },
  ],
  COMMERCIAL_CONTRACT_SENT: [
    {
      label: "Mark Contract Signed",
      toState: "CONTRACT_SIGNED",
      icon: CheckCircle,
      style: "bg-purple-500 hover:bg-purple-600 text-white",
      defaultNote: "Operator has signed the commercial contract.",
    },
  ],
  CONTRACT_SIGNED: [
    {
      label: "Create Payment Account",
      toState: "RAZORPAY_LINKED_ACCOUNT_CREATED",
      icon: CheckCircle,
      style: "bg-indigo-500 hover:bg-indigo-600 text-white",
      defaultNote: "Razorpay linked account created for operator.",
    },
  ],
  RAZORPAY_LINKED_ACCOUNT_CREATED: [
    {
      label: "Mark Training Complete",
      toState: "TRAINING_COMPLETED",
      icon: CheckCircle,
      style: "bg-cyan-500 hover:bg-cyan-600 text-white",
      defaultNote: "Operator has completed mandatory platform training.",
    },
  ],
  TRAINING_COMPLETED: [
    {
      label: "Publish Test Listing",
      toState: "TEST_LISTING_PUBLISHED",
      icon: CheckCircle,
      style: "bg-teal-500 hover:bg-teal-600 text-white",
      defaultNote: "Test listing reviewed and published.",
    },
  ],
  TEST_LISTING_PUBLISHED: [
    {
      label: "✓ Approve — Go Live",
      toState: "ACTIVE_PROBATION",
      icon: ThumbsUp,
      style: "bg-green-500 hover:bg-green-600 text-white",
      defaultNote:
        "Application approved. Operator is now live under probationary monitoring.",
    },
    {
      label: "Reject Application",
      toState: "OFFBOARDED",
      icon: XCircle,
      style: "bg-red-500 hover:bg-red-600 text-white",
      defaultNote: "",
      requireNote: true,
    },
  ],
  ACTIVE_PROBATION: [
    {
      label: "Upgrade to Full Access",
      toState: "ACTIVE_FULL",
      icon: ThumbsUp,
      style: "bg-green-500 hover:bg-green-600 text-white",
      defaultNote:
        "Probationary period completed. Operator upgraded to full access.",
    },
    {
      label: "Suspend Account",
      toState: "SUSPENDED",
      icon: Ban,
      style: "bg-red-500 hover:bg-red-600 text-white",
      defaultNote: "",
      requireNote: true,
    },
  ],
  ACTIVE_FULL: [
    {
      label: "Suspend Account",
      toState: "SUSPENDED",
      icon: Ban,
      style: "bg-red-500 hover:bg-red-600 text-white",
      defaultNote: "",
      requireNote: true,
    },
  ],
  SUSPENDED: [
    {
      label: "Reinstate Account",
      toState: "ACTIVE_PROBATION",
      icon: CheckCircle,
      style: "bg-green-500 hover:bg-green-600 text-white",
      defaultNote: "Account reinstated after review.",
    },
    {
      label: "Offboard Permanently",
      toState: "OFFBOARDED",
      icon: XCircle,
      style: "bg-red-700 hover:bg-red-800 text-white",
      defaultNote: "",
      requireNote: true,
    },
  ],
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StateBadge({ state, large }) {
  const cls = STATE_COLORS[state] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${
        large ? "px-4 py-1.5 text-sm" : "px-3 py-1 text-xs"
      } ${cls}`}
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

function formatDate(ts) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OperatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Review / quick-action state
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // stores toState while loading
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Advanced state-change panel
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedState, setAdvancedState] = useState("");
  const [advancedNote, setAdvancedNote] = useState("");
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [docRemark, setDocRemark] = useState("");
  const [docActionLoading, setDocActionLoading] = useState(null); // `${key}:${status}`

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminOperatorsAPI.getById(id);
        setOperator(res.data.operator);
        setAdvancedState(res.data.operator.onboardingState);
      } catch (err) {
        setFetchError(err.response?.data?.message || "Failed to load operator.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Execute a state transition
  const doTransition = async (toState, note) => {
    setActionError("");
    setActionSuccess("");
    setActionLoading(toState);
    try {
      const res = await adminOperatorsAPI.transitionState(id, {
        newState: toState,
        note: note.trim(),
      });
      const updated = res.data.operator;
      setOperator(updated);
      setAdvancedState(updated.onboardingState);
      setReviewNote("");
      setActionSuccess(
        `Status updated to "${STATE_LABELS[updated.onboardingState]}".`
      );
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Action failed. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const doDocStatus = async (key, status) => {
    setActionError("");
    setActionSuccess("");
    const remark = docRemark.trim();
    if ((status === "REJECTED" || status === "REUPLOAD_REQUIRED") && remark.length < 5) {
      setActionError("Please enter a remark (min 5 characters).");
      return;
    }
    setDocActionLoading(`${key}:${status}`);
    try {
      const res = await adminOperatorsAPI.updateDocumentStatus(id, {
        key,
        status,
        remark,
      });
      setOperator(res.data.operator);
      setDocRemark("");
      setActionSuccess("Document status updated.");
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update document status.");
    } finally {
      setDocActionLoading(null);
    }
  };

  const handleQuickAction = (action) => {
    const note = reviewNote.trim() || action.defaultNote;
    if (!note || note.length < 5) {
      setActionError(
        action.requireNote
          ? "Please enter a review comment before rejecting."
          : "Please enter a note (min 5 characters)."
      );
      return;
    }
    doTransition(action.toState, note);
  };

  const handleAdvancedSubmit = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");
    if (advancedNote.trim().length < 5) {
      setActionError("Note must be at least 5 characters.");
      return;
    }
    setAdvancedLoading(true);
    try {
      const res = await adminOperatorsAPI.transitionState(id, {
        newState: advancedState,
        note: advancedNote.trim(),
      });
      const updated = res.data.operator;
      setOperator(updated);
      setAdvancedState(updated.onboardingState);
      setAdvancedNote("");
      setShowAdvanced(false);
      setActionSuccess(
        `Status updated to "${STATE_LABELS[updated.onboardingState]}".`
      );
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Action failed. Please try again."
      );
    } finally {
      setAdvancedLoading(false);
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError || !operator) {
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
  }

  const quickActions = QUICK_ACTIONS[operator.onboardingState] || [];
  const history = [...(operator.transitionHistory || [])].reverse();
  const docsUploaded = Object.values(operator.documents || {}).filter(Boolean).length;
  const totalDocs = Object.keys(DOCUMENT_LABELS).length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Back + header ── */}
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
            <StateBadge state={operator.onboardingState} large />
          </div>
          <p className="text-sm text-gray-500">
            {operator.email} · Registered {formatDate(operator.createdAt)}
          </p>
        </div>
      </div>

      {/* ── Global feedback ── */}
      {actionSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-sm text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* ── Review Action Panel (shown when quick actions exist) ── */}
      {quickActions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            <h2 className="text-base font-semibold text-gray-800">
              Review &amp; Decision
            </h2>
          </div>

          {/* Document readiness indicator */}
          {operator.onboardingState === "DOCUMENTS_SUBMITTED" && (
            <div
              className={`mb-4 p-3 rounded-xl border text-sm flex items-center gap-2 ${
                docsUploaded === totalDocs
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              {docsUploaded === totalDocs ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              {docsUploaded} of {totalDocs} documents uploaded
              {docsUploaded < totalDocs && " — some documents are missing"}
            </div>
          )}

          {/* Review comment box */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Review Comment{" "}
              <span className="text-gray-400 font-normal">
                (required for rejection; optional for approval)
              </span>
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => {
                setReviewNote(e.target.value);
                setActionError("");
              }}
              rows={3}
              placeholder="Add a comment for the operator — e.g. 'Documents verified, proceeding to KYC' or 'PAN card image is blurry, please re-upload'…"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all"
            />
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isLoading = actionLoading === action.toState;
              return (
                <button
                  key={action.toState}
                  onClick={() => handleQuickAction(action)}
                  disabled={actionLoading !== null}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${action.style}`}
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Business Profile ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Business Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Business Name" value={operator.businessName} />
          <InfoRow label="Contact Name" value={operator.contactName} />
          <InfoRow label="Email" value={operator.email} />
          <InfoRow label="Phone" value={operator.phone} />
          <InfoRow label="GSTIN" value={operator.gstin} />
          <InfoRow label="PAN" value={operator.pan} />
          <InfoRow label="TAN" value={operator.tan} />
          <InfoRow label="Bank Account" value={operator.bankAccountNumber} />
          <InfoRow label="Years of Experience" value={operator.yearsOfExperience ?? "—"} />
          <InfoRow label="Tours Conducted" value={operator.toursConducted ?? "—"} />
          <InfoRow
            label="Tour Types"
            value={(operator.tourTypes || []).filter(Boolean).join(", ") || "—"}
          />
          <div className="sm:col-span-2">
            <InfoRow
              label="Registered Address"
              value={operator.registeredAddress}
            />
          </div>
          <div className="sm:col-span-2">
            <InfoRow label="Office Address" value={operator.officeAddress} />
          </div>
          <div className="sm:col-span-2">
            <InfoRow
              label="Business Information"
              value={operator.businessInfo || "—"}
            />
          </div>
          <div className="sm:col-span-2">
            <InfoRow
              label="Regions Operated"
              value={(operator.regionsOperated || []).filter(Boolean).join(", ")}
            />
          </div>
          <div className="sm:col-span-2">
            <InfoRow
              label="Services Offered"
              value={(operator.servicesOffered || []).filter(Boolean).join(", ")}
            />
          </div>
          <InfoRow
            label="Tourism License Expiry"
            value={
              operator.tourismTravelLicenseExpiry
                ? new Date(operator.tourismTravelLicenseExpiry).toLocaleDateString("en-IN")
                : "—"
            }
          />
          <InfoRow
            label="Liability Insurance Expiry"
            value={
              operator.liabilityInsuranceExpiry
                ? new Date(operator.liabilityInsuranceExpiry).toLocaleDateString("en-IN")
                : "—"
            }
          />
        </div>
      </div>

      {/* ── Documents ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Documents</h2>
          <span className="text-sm text-gray-500">
            {docsUploaded}/{totalDocs} uploaded
          </span>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Document Remark (for reject / re-upload)
          </label>
          <input
            value={docRemark}
            onChange={(e) => setDocRemark(e.target.value)}
            placeholder="e.g. PAN image is unclear. Please re-upload."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(DOCUMENT_LABELS).map(([key, label]) => {
            const path = operator.documents?.[key];
            const st = operator.documentStatus?.[key]?.status || (path ? "PENDING" : "PENDING");
            const stLabel = DOC_STATUS_LABELS[st] || st;
            const stColor = DOC_STATUS_COLORS[st] || "bg-gray-50 text-gray-700 border-gray-200";
            return (
              <div
                key={key}
                className={`p-3 rounded-xl border ${
                  path
                    ? "border-teal-200 bg-teal-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText
                      className={`w-4 h-4 flex-shrink-0 ${
                        path ? "text-teal-500" : "text-red-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="text-sm text-gray-700 truncate block">
                        {label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border mt-1 ${stColor}`}>
                        {stLabel}
                      </span>
                      {operator.documentStatus?.[key]?.remark && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {operator.documentStatus[key].remark}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {path ? (
                      <a
                        href={path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-red-400">Missing</span>
                    )}
                  </div>
                </div>

                {path && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => doDocStatus(key, "APPROVED")}
                      disabled={docActionLoading === `${key}:APPROVED`}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => doDocStatus(key, "REUPLOAD_REQUIRED")}
                      disabled={docActionLoading === `${key}:REUPLOAD_REQUIRED`}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                    >
                      Ask Re-upload
                    </button>
                    <button
                      type="button"
                      onClick={() => doDocStatus(key, "REJECTED")}
                      disabled={docActionLoading === `${key}:REJECTED`}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Advanced State Change (collapsible) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-semibold text-gray-700">
            Advanced — Set Any State
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              showAdvanced ? "rotate-180" : ""
            }`}
          />
        </button>

        {showAdvanced && (
          <form
            onSubmit={handleAdvancedSubmit}
            className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Target State
              </label>
              <div className="relative">
                <select
                  value={advancedState}
                  onChange={(e) => setAdvancedState(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  {VALID_STATES.map((s) => (
                    <option key={s} value={s}>
                      {STATE_LABELS[s]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Note{" "}
                <span className="text-gray-400 font-normal">(min 5 chars)</span>
              </label>
              <textarea
                value={advancedNote}
                onChange={(e) => setAdvancedNote(e.target.value)}
                rows={3}
                placeholder="Reason for this manual state change…"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={advancedLoading || advancedNote.trim().length < 5}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
            >
              {advancedLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Apply State Change
            </button>
          </form>
        )}
      </div>

      {/* ── Transition History ── */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800">
              Review History
            </h2>
          </div>
          <div className="space-y-4">
            {history.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                      entry.toState === "ACTIVE_FULL" ||
                      entry.toState === "ACTIVE_PROBATION"
                        ? "bg-green-400"
                        : entry.toState === "OFFBOARDED" ||
                          entry.toState === "SUSPENDED"
                        ? "bg-red-400"
                        : "bg-primary-400"
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
                    <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      {entry.note}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    {formatDate(entry.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
