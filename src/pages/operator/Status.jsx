import { useEffect, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plane,
  Upload,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";
import { operatorAuthAPI } from "../../services/api";

const STATE_CONFIG = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
  DOCUMENTS_SUBMITTED: {
    label: "Documents Submitted",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  KYC_VERIFICATION: {
    label: "KYC Verification",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
  },
  COMMERCIAL_CONTRACT_SENT: {
    label: "Contract Sent",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  CONTRACT_SIGNED: {
    label: "Contract Signed",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  RAZORPAY_LINKED_ACCOUNT_CREATED: {
    label: "Payment Account Created",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  TRAINING_COMPLETED: {
    label: "Training Completed",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    dot: "bg-cyan-500",
  },
  TEST_LISTING_PUBLISHED: {
    label: "Test Listing Published",
    color: "bg-teal-100 text-teal-700 border-teal-200",
    dot: "bg-teal-500",
  },
  ACTIVE_PROBATION: {
    label: "Active (Probation)",
    color: "bg-lime-100 text-lime-700 border-lime-200",
    dot: "bg-lime-500",
  },
  ACTIVE_FULL: {
    label: "Active",
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  OFFBOARDED: {
    label: "Offboarded",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
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
  REUPLOAD_REQUIRED: "Re-upload required",
};

const DOC_STATUS_COLORS = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  REUPLOAD_REQUIRED: "bg-orange-50 text-orange-700 border-orange-200",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

function StateBadge({ state }) {
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${cfg.color}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
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

export default function OperatorStatus() {
  const { operator, operatorLoading, refreshOperator, logout } =
    useOperatorAuth();
  const navigate = useNavigate();
  const [reuploadLoadingKey, setReuploadLoadingKey] = useState("");
  const [reuploadProgress, setReuploadProgress] = useState({});
  const [reuploadError, setReuploadError] = useState({});

  const doRefresh = useCallback(() => {
    refreshOperator();
  }, [refreshOperator]);

  // Poll every 60 seconds
  useEffect(() => {
    const id = setInterval(doRefresh, 60000);
    return () => clearInterval(id);
  }, [doRefresh]);

  if (operatorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!operator) {
    navigate("/operator/login", { replace: true });
    return null;
  }

  // DRAFT means they haven't submitted the form yet — send them there
  if (operator.onboardingState === "DRAFT") {
    navigate("/operator/onboarding", { replace: true });
    return null;
  }

  const state = operator.onboardingState;
  const history = [...(operator.transitionHistory || [])].reverse();
  const latestNote = history[0]?.note;
  const documents = operator.documents || {};
  const documentStatus = operator.documentStatus || {};
  const documentRows = Object.keys(DOCUMENT_LABELS).filter(
    (k) => documents[k] || documentStatus[k]?.status
  );

  const handleReupload = async (key, file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setReuploadError((prev) => ({
        ...prev,
        [key]: "Only PDF, JPEG, JPG, or PNG files are allowed.",
      }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setReuploadError((prev) => ({
        ...prev,
        [key]: "File must not exceed 5 MB.",
      }));
      return;
    }

    setReuploadError((prev) => ({ ...prev, [key]: "" }));
    setReuploadLoadingKey(key);
    setReuploadProgress((prev) => ({ ...prev, [key]: 0 }));

    const formData = new FormData();
    formData.append("key", key);
    formData.append("file", file);

    try {
      await operatorAuthAPI.reuploadDocument(formData, {
        onUploadProgress: (evt) => {
          const total = evt.total || 0;
          if (total <= 0) return;
          const pct = Math.round((evt.loaded / total) * 100);
          setReuploadProgress((prev) => ({ ...prev, [key]: pct }));
        },
      });
      await refreshOperator();
    } catch (err) {
      setReuploadError((prev) => ({
        ...prev,
        [key]:
          err.response?.data?.message ||
          "Re-upload failed. Please try again.",
      }));
    } finally {
      setReuploadLoadingKey("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Application Status
              </h1>
              <p className="text-sm text-gray-500">
                {operator.businessName || operator.contactName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={doRefresh}
              className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/operator/login", { replace: true });
              }}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Current State Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Current Status</p>
              <StateBadge state={state} />
            </div>
            {state === "ACTIVE_PROBATION" || state === "ACTIVE_FULL" ? (
              <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
            ) : state === "SUSPENDED" || state === "OFFBOARDED" ? (
              <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            ) : (
              <Clock className="w-8 h-8 text-teal-400 flex-shrink-0" />
            )}
          </div>

          {/* State-specific messages */}
          {state === "DRAFT" && (
            <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-100">
              <p className="text-sm text-teal-700 mb-3">
                Your account is created. Complete the onboarding form to submit
                your application.
              </p>
              <Link
                to="/operator/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Complete Onboarding
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {state === "DOCUMENTS_SUBMITTED" && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-700">
                Your documents have been submitted and are under review. We'll
                update your status within 2–3 business days.
              </p>
            </div>
          )}

          {state === "SUSPENDED" && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Your account has been suspended.
                  </p>
                  {latestNote && (
                    <p className="text-sm text-red-600 mt-1">
                      Reason: {latestNote}
                    </p>
                  )}
                  <p className="text-sm text-red-500 mt-1">
                    Please contact support for assistance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {state === "OFFBOARDED" && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Your account has been offboarded.
                  </p>
                  {latestNote && (
                    <p className="text-sm text-slate-600 mt-1">
                      Note: {latestNote}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {(state === "ACTIVE_PROBATION" || state === "ACTIVE_FULL") && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-sm text-green-700 mb-3">
                {state === "ACTIVE_FULL"
                  ? "Congratulations! Your account is fully active."
                  : "Your account is active under probationary monitoring."}
              </p>
              <Link
                to="/operator/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Transition History */}
        {documentRows.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Document Verification
                </h2>
                <p className="text-sm text-gray-500">
                  Track per-document approval and re-upload requests.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {documentRows.map((key) => {
                const status = documentStatus[key]?.status || "PENDING";
                const remark = documentStatus[key]?.remark || "";
                const updatedAt = documentStatus[key]?.updatedAt;
                const url = documents[key];
                const isReupload = status === "REUPLOAD_REQUIRED";
                const isUploading = reuploadLoadingKey === key;
                const progress = reuploadProgress[key] || 0;
                const rowErr = reuploadError[key];

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {DOCUMENT_LABELS[key]}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                              DOC_STATUS_COLORS[status] ||
                              "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {DOC_STATUS_LABELS[status] || status}
                          </span>
                          {updatedAt && (
                            <span className="text-xs text-gray-400">
                              Updated: {formatDate(updatedAt)}
                            </span>
                          )}
                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                            >
                              View
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {remark && (
                          <p className="mt-2 text-sm text-gray-600">
                            Remark:{" "}
                            <span className="font-medium text-gray-700">
                              {remark}
                            </span>
                          </p>
                        )}
                      </div>

                      {isReupload && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer hover:border-teal-300">
                            <Upload className="w-4 h-4 text-teal-600" />
                            {isUploading ? "Uploading…" : "Re-upload"}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              disabled={isUploading}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = "";
                                handleReupload(key, f);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {isUploading && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Upload progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="mt-1 w-full h-2 rounded-full bg-white border border-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-teal-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {rowErr && (
                      <p className="mt-3 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {rowErr}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Status History
            </h2>
            <div className="space-y-4">
              {history.map((entry, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                    {i < history.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-4 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <StateBadge state={entry.toState} />
                      <span className="text-xs text-gray-400">
                        from{" "}
                        <span className="font-medium text-gray-500">
                          {STATE_CONFIG[entry.fromState]?.label || entry.fromState}
                        </span>
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2">
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
          </div>
        )}
      </div>
    </div>
  );
}
