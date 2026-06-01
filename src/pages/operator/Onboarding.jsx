import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Plane,
  FileText,
  Image as ImageIcon,
  LogOut,
  User,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";
import { operatorAuthAPI } from "../../services/api";

const DOCUMENT_FIELDS = [
  { key: "gstCertificate", label: "GST Registration Certificate" },
  { key: "pan", label: "PAN Card" },
  { key: "incorporationCertificate", label: "Certificate of Incorporation" },
  { key: "bankProof", label: "Bank Account Proof (Cancelled Cheque)" },
  { key: "tan", label: "TAN Certificate" },
  {
    key: "industryAssociationCertificate",
    label: "Industry Association Certificate",
  },
  {
    key: "liabilityInsuranceCertificate",
    label: "Liability Insurance Certificate",
  },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const PORTAL_STEPS = [
  { icon: User, label: "Register" },
  { icon: ClipboardList, label: "Onboarding" },
  { icon: LayoutDashboard, label: "Dashboard" },
];

const TOUR_TYPES = [
  { key: "DOMESTIC_TOURS", label: "Domestic Tours" },
  { key: "INTERNATIONAL_TOURS", label: "International Tours" },
  { key: "ADVENTURE_TOURS", label: "Adventure Tours" },
];

const SERVICES = [
  { key: "HOTEL_BOOKING", label: "Hotel Booking" },
  { key: "CAB_SERVICES", label: "Cab Services" },
  { key: "VISA_SERVICES", label: "Visa Services" },
];

const STEP_CONFIG = [
  {
    title: "Business Details",
    subtitle: "Basic details as per your registration and GST information.",
  },
  {
    title: "Bank & Legal",
    subtitle: "Bank proof and authorized signatory verification documents.",
  },
  {
    title: "Travel Verification",
    subtitle: "Travel/tourism licenses and industry verification.",
  },
  {
    title: "Profile Setup",
    subtitle: "Help customers understand your business and services.",
  },
];

const DOCUMENTS = {
  gstCertificate: {
    label: "GST Registration Certificate",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    allowed: ALLOWED_TYPES,
    stepIndex: 1,
  },
  pan: {
    label: "PAN Card (Document)",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    allowed: ALLOWED_TYPES,
    stepIndex: 1,
  },
  incorporationCertificate: {
    label: "Certificate of Incorporation",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    allowed: ALLOWED_TYPES,
    stepIndex: 1,
  },
  bankProof: {
    label: "Bank Account Proof (Cancelled Cheque)",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    allowed: ALLOWED_TYPES,
    stepIndex: 1,
  },
  tan: {
    label: "TAN Certificate",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    allowed: ALLOWED_TYPES,
    stepIndex: 1,
  },
  authorizedSignatoryIdProof: {
    label: "Authorized Signatory ID Proof (Aadhaar / Passport / DL)",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    allowed: ALLOWED_TYPES,
    stepIndex: 1,
  },
  officeAddressProof: {
    label: "Office Address Proof (Electricity Bill / Rental Agreement / Utility Bill)",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    allowed: ALLOWED_TYPES,
    stepIndex: 1,
  },
  tourismTravelLicense: {
    label: "Tourism / Travel License (Tourism License / Registration / State Certificate)",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    allowed: ALLOWED_TYPES,
    stepIndex: 2,
  },
  industryAssociationCertificate: {
    label: "Industry Association Certificate",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    allowed: ALLOWED_TYPES,
    stepIndex: 2,
  },
  liabilityInsuranceCertificate: {
    label: "Liability Insurance Certificate",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png",
    allowed: ALLOWED_TYPES,
    stepIndex: 2,
  },
  companyLogo: {
    label: "Company Logo",
    required: false,
    accept: ".jpg,.jpeg,.png",
    allowed: ["image/jpeg", "image/jpg", "image/png"],
    stepIndex: 3,
  },
  coverBanner: {
    label: "Cover Banner",
    required: false,
    accept: ".jpg,.jpeg,.png",
    allowed: ["image/jpeg", "image/jpg", "image/png"],
    stepIndex: 3,
  },
};

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function getFileKind(file) {
  if (!file) return "unknown";
  if (file.type === "application/pdf") return "pdf";
  if (file.type?.startsWith("image/")) return "image";
  return "unknown";
}

export default function OperatorOnboarding() {
  const { operator, operatorLoading, refreshOperator, logout } =
    useOperatorAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    businessName: "",
    registeredAddress: "",
    officeAddress: "",
    businessInfo: "",
    gstin: "",
    pan: "",
    // bank details
    bankAccountNumber: "",
  });
  const [files, setFiles] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [previews, setPreviews] = useState({});
  const [dragOverKey, setDragOverKey] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  // Guard: if not DRAFT, redirect appropriately
  useEffect(() => {
    if (operatorLoading) return;
    if (!operator) {
      navigate("/login", { replace: true });
      return;
    }
    if (operator.onboardingState !== "DRAFT") {
      if (
        operator.onboardingState === "ACTIVE_PROBATION" ||
        operator.onboardingState === "ACTIVE_FULL"
      ) {
        navigate("/operator/dashboard", { replace: true });
      } else {
        navigate("/operator/status", { replace: true });
      }
    }
  }, [operator, operatorLoading, navigate]);

  if (operatorLoading || !operator || operator.onboardingState !== "DRAFT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          null;
        }
      });
    };
  }, [previews]);

  const setArrayToggle = (key, value) => {
    setForm((prev) => {
      const cur = Array.isArray(prev[key]) ? prev[key] : [];
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      return { ...prev, [key]: next };
    });
  };

  const handleFileChange = (key, file) => {
    if (!file) return;
    const cfg = DOCUMENTS[key];
    const allowed = cfg?.allowed || ALLOWED_TYPES;
    if (!allowed.includes(file.type)) {
      setFileErrors((prev) => ({
        ...prev,
        [key]: "Only PDF, JPEG, JPG, or PNG files are allowed.",
      }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileErrors((prev) => ({
        ...prev,
        [key]: "File must not exceed 5 MB.",
      }));
      return;
    }
    setFileErrors((prev) => ({ ...prev, [key]: "" }));
    setFiles((prev) => ({ ...prev, [key]: file }));

    const kind = getFileKind(file);
    if (kind === "image" || kind === "pdf") {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => {
        const prevUrl = prev[key];
        if (prevUrl) {
          try {
            URL.revokeObjectURL(prevUrl);
          } catch {
            null;
          }
        }
        return { ...prev, [key]: url };
      });
    } else {
      setPreviews((prev) => {
        const prevUrl = prev[key];
        if (prevUrl) {
          try {
            URL.revokeObjectURL(prevUrl);
          } catch {
            null;
          }
        }
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateStep = (idx) => {
    const nextFieldErrors = {};
    const nextFileErrors = { ...fileErrors };

    const requireText = (k, msg = "This field is required.") => {
      const v = form[k];
      if (v === undefined || v === null || String(v).trim().length === 0) {
        nextFieldErrors[k] = msg;
      }
    };

    if (idx === 0) {
      requireText("businessName");
      requireText("registeredAddress");
      requireText("officeAddress");
      requireText("gstin");
      requireText("pan");
      requireText("tan");
    }

    if (idx === 1) {
      requireText("bankAccountNumber");
      Object.entries(DOCUMENTS).forEach(([k, cfg]) => {
        if (cfg.stepIndex !== 1) return;
        if (!cfg.required) return;
        if (!files[k]) nextFileErrors[k] = "This document is required.";
      });
    }

    if (idx === 2) {
      Object.entries(DOCUMENTS).forEach(([k, cfg]) => {
        if (cfg.stepIndex !== 2) return;
        if (!cfg.required) return;
        if (!files[k]) nextFileErrors[k] = "This document is required.";
      });
    }

    if (idx === 3) {
      requireText("businessInfo", "Please add a short business description.");
      requireText("yearsOfExperience");
      requireText("toursConducted");
      requireText(
        "regionsOperated",
        "Add countries/states you operate in (comma-separated)."
      );
      if (!Array.isArray(form.tourTypes) || form.tourTypes.length === 0) {
        nextFieldErrors.tourTypes = "Select at least one tour type.";
      }
      if (
        !Array.isArray(form.servicesOffered) ||
        form.servicesOffered.length === 0
      ) {
        nextFieldErrors.servicesOffered = "Select at least one service.";
      }
    }

    setFieldErrors(nextFieldErrors);
    setFileErrors(nextFileErrors);

    return (
      Object.keys(nextFieldErrors).length === 0 &&
      !Object.values(nextFileErrors).some((e) => e)
    );
  };

  const goNext = () => {
    setError("");
    if (!validateStep(stepIndex)) {
      setError("Please complete the required fields in this step.");
      return;
    }
    setStepIndex((s) => Math.min(s + 1, STEP_CONFIG.length - 1));
  };

  const goBack = () => {
    setError("");
    setStepIndex((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const hasErrors = Object.values(fileErrors).some((e) => e);
    if (hasErrors) {
      setError("Please fix errors before submitting.");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    Object.entries(files).forEach(([k, f]) => formData.append(k, f));

    setLoading(true);
    setUploadProgress(0);
    try {
      await operatorAuthAPI.submitOnboarding(formData, {
        onUploadProgress: (evt) => {
          const total = evt.total || 0;
          if (total <= 0) return;
          const pct = Math.round((evt.loaded / total) * 100);
          setUploadProgress(pct);
        },
      });
      await refreshOperator();
      navigate("/operator/status", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Submission failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">TripReel</h1>
            <p className="text-xs text-gray-400">Operator Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">
            {operator.email}
          </span>
          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress stepper */}
        <div className="flex items-center justify-center mb-8">
          {PORTAL_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === 1;
            const isDone = i === 0;
            return (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isDone || isActive
                        ? "bg-teal-500 border-teal-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-white" : "text-gray-400"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive
                        ? "text-teal-600"
                        : isDone
                        ? "text-teal-500"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < PORTAL_STEPS.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 ${
                      i === 0 ? "bg-teal-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Complete Your Onboarding
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Step {stepIndex + 1} of {STEP_CONFIG.length} •{" "}
            {STEP_CONFIG[stepIndex].title}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {STEP_CONFIG[stepIndex].subtitle}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5">
              Business Details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  key: "businessName",
                  label: "Business Name",
                  placeholder: "Acme Tours Pvt. Ltd.",
                  full: true,
                },
                {
                  key: "registeredAddress",
                  label: "Registered Address",
                  placeholder: "123 MG Road, Mumbai 400001",
                  full: true,
                },
                { key: "gstin", label: "GSTIN", placeholder: "22AAAAA0000A1Z5" },
                { key: "pan", label: "PAN Number", placeholder: "AAAAA0000A" },
                { key: "tan", label: "TAN Number", placeholder: "AAAA00000A" },
                {
                  key: "bankAccountNumber",
                  label: "Bank Account Number",
                  placeholder: "000123456789",
                },
              ].map(({ key, label, placeholder, full }) => (
                <div key={key} className={full ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                  </label>
                  <input
                    type="text"
                    required
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Document Uploads */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              Required Documents
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Upload PDF, JPEG, JPG, or PNG. Max 5 MB each.
            </p>
            <div className="space-y-4">
              {DOCUMENT_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${
                      files[key]
                        ? "border-teal-400 bg-teal-50"
                        : fileErrors[key]
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 hover:border-teal-300"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileChange(key, e.target.files?.[0])
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-3">
                      {files[key] ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-teal-700">
                              {files[key].name}
                            </p>
                            <p className="text-xs text-teal-500">
                              {(files[key].size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="text-teal-600 font-medium">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">
                              PDF, JPEG, JPG, PNG up to 5 MB
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {fileErrors[key] && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fileErrors[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md shadow-teal-500/30"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Submit Application
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
