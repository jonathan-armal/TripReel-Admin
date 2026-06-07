import { useEffect, useCallback, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Upload,
  AlertCircle,
} from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";
import { operatorAuthAPI } from "../../services/api";

const DOCUMENT_LABELS = {
  governmentId: "Government ID (Aadhaar / Passport / DL)",
  selfieVerification: "Selfie Verification",
  tradeLicense: "Trade License",
  panCard: "PAN Card",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const DOC_STATUS_UI = {
  PENDING: {
    label: "Under Review",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-50 text-green-700 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-200",
  },
  REUPLOAD_REQUIRED: {
    label: "Re-upload Required",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

export default function OperatorStatus() {
  const { operator, operatorLoading, refreshOperator } = useOperatorAuth();
  const navigate = useNavigate();

  const [reuploadLoading, setReuploadLoading] = useState("");
  const [reuploadErrors, setReuploadErrors] = useState({});
  const [reuploadSuccess, setReuploadSuccess] = useState("");

  const doRefresh = useCallback(() => {
    refreshOperator();
  }, [refreshOperator]);

  // Poll for status changes every 30s
  useEffect(() => {
    const id = setInterval(doRefresh, 30000);
    return () => clearInterval(id);
  }, [doRefresh]);

  // Redirect logic
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (operatorLoading) return;
    if (redirectedRef.current) return;
    if (!operator) {
      redirectedRef.current = true;
      navigate("/login", { replace: true });
      return;
    }
    if (operator.onboardingState === "DRAFT") {
      redirectedRef.current = true;
      navigate("/operator/onboarding", { replace: true });
      return;
    }
    if (
      operator.onboardingState === "APPROVED" ||
      operator.onboardingState === "ACTIVE_FULL"
    ) {
      redirectedRef.current = true;
      navigate("/operator/dashboard", { replace: true });
      return;
    }
  }, [operator?.onboardingState, operatorLoading, navigate]);

  if (
    operatorLoading ||
    !operator ||
    operator.onboardingState === "DRAFT" ||
    operator.onboardingState === "APPROVED" ||
    operator.onboardingState === "ACTIVE_FULL"
  ) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const state = operator.onboardingState;
  const documentStatus = operator.documentStatus || {};

  const handleReupload = async (key, file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setReuploadErrors((prev) => ({
        ...prev,
        [key]: "Only PDF, JPG, or PNG allowed.",
      }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setReuploadErrors((prev) => ({
        ...prev,
        [key]: "Max file size is 5 MB.",
      }));
      return;
    }
    setReuploadErrors((prev) => ({ ...prev, [key]: "" }));
    setReuploadLoading(key);
    setReuploadSuccess("");
    try {
      const fd = new FormData();
      fd.append("key", key);
      fd.append("file", file);
      await operatorAuthAPI.reuploadDocument(fd);
      await refreshOperator();
      setReuploadSuccess(
        `${DOCUMENT_LABELS[key]} re-uploaded successfully. It is now under review.`,
      );
    } catch (err) {
      setReuploadErrors((prev) => ({
        ...prev,
        [key]: err.response?.data?.message || "Upload failed.",
      }));
    } finally {
      setReuploadLoading("");
    }
  };

  // Get suspension reason from transition history
  const suspensionNote = (operator.transitionHistory || [])
    .filter((h) => h.toState === "SUSPENDED")
    .pop()?.note;

  const STATUS_UI = {
    PENDING_APPROVAL: {
      icon: <Clock className="w-14 h-14 text-amber-400" />,
      title: "Approval Pending",
      subtitle: "Your application is under review",
      msgColor: "bg-amber-50 border-amber-200 text-amber-700",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      message:
        "Our team is reviewing your application. This usually takes 2–3 business days.",
    },
    REJECTED: {
      icon: <XCircle className="w-14 h-14 text-red-400" />,
      title: "Application Rejected",
      subtitle: "Your application was not approved",
      msgColor: "bg-red-50 border-red-200 text-red-700",
      badge: "bg-red-100 text-red-700 border-red-200",
      message:
        operator.rejectionReason ||
        "Your application did not meet our requirements. Contact support for details.",
    },
    SUSPENDED: {
      icon: <AlertTriangle className="w-14 h-14 text-orange-400" />,
      title: "Account Suspended",
      subtitle: "Your account has been suspended by admin",
      msgColor: "bg-orange-50 border-orange-200 text-orange-700",
      badge: "bg-orange-100 text-orange-700 border-orange-200",
      message:
        suspensionNote ||
        "Your account has been suspended. Please contact admin for more details.",
    },
  };

  const ui = STATUS_UI[state] || STATUS_UI.PENDING_APPROVAL;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Status card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="flex justify-center mb-4">{ui.icon}</div>
        <span
          className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${ui.badge}`}
        >
          {ui.title}
        </span>
        <h2 className="text-xl font-bold text-gray-900 mt-3 mb-2">
          {ui.subtitle}
        </h2>
        <div className={`p-4 rounded-xl border mt-4 ${ui.msgColor}`}>
          <p className="text-sm">{ui.message}</p>
        </div>

        {/* Operator info */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-800">
              {operator.contactName}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-800">{operator.email}</span>
          </div>
          {operator.businessName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Business</span>
              <span className="font-medium text-gray-800">
                {operator.businessName}
              </span>
            </div>
          )}
        </div>

        {state === "PENDING_APPROVAL" && (
          <p className="mt-4 text-xs text-gray-400">
            Auto-refreshes every 30 seconds.
          </p>
        )}

        {state === "REJECTED" && (
          <div className="mt-5">
            <a
              href="mailto:support@tripreel.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Contact Support
            </a>
          </div>
        )}

        {state === "SUSPENDED" && (
          <div className="mt-5 space-y-3">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-left">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                What this means
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Your packages have been temporarily hidden from users</li>
                <li>• Existing bookings are not affected</li>
                <li>• You cannot create new packages or batches</li>
              </ul>
            </div>
            <a
              href="mailto:admin@tripreel.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Contact Admin
            </a>
          </div>
        )}
      </div>

      {/* Document status + reupload (for PENDING_APPROVAL and REJECTED) */}
      {state !== "SUSPENDED" && Object.keys(documentStatus).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            Document Status
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Check the status of each document. Re-upload if requested.
          </p>

          {reuploadSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />{" "}
              {reuploadSuccess}
            </div>
          )}

          <div className="space-y-3">
            {Object.entries(DOCUMENT_LABELS).map(([key, label]) => {
              const docSt = documentStatus[key];
              if (!docSt) return null;
              const status = docSt.status || "PENDING";
              const remark = docSt.remark;
              const stUI = DOC_STATUS_UI[status] || DOC_STATUS_UI.PENDING;
              const needsAction =
                status === "REUPLOAD_REQUIRED" || status === "REJECTED";
              const isUploading = reuploadLoading === key;
              const err = reuploadErrors[key];

              return (
                <div
                  key={key}
                  className={`rounded-xl border p-4 ${needsAction ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-gray-50"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {label}
                      </p>
                      <span
                        className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${stUI.color}`}
                      >
                        {stUI.label}
                      </span>
                      {remark && (
                        <p className="mt-2 text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <span className="font-medium text-gray-700">
                            Admin note:{" "}
                          </span>
                          {remark}
                        </p>
                      )}
                    </div>
                    {status === "APPROVED" && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>

                  {needsAction && (
                    <div className="mt-3">
                      <label
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm font-medium ${
                          isUploading
                            ? "border-teal-300 bg-teal-50 text-teal-600"
                            : "border-gray-200 bg-white text-gray-700 hover:border-teal-300"
                        }`}
                      >
                        {isUploading ? (
                          <span className="w-4 h-4 border-2 border-teal-400/40 border-t-teal-500 rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-teal-500" />
                        )}
                        {isUploading ? "Uploading…" : "Upload New File"}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={!!reuploadLoading}
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            handleReupload(key, f);
                          }}
                        />
                      </label>
                      {err && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {err}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
