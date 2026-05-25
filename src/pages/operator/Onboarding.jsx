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
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";
import { operatorAuthAPI } from "../../services/api";

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
    tan: "",
    bankAccountNumber: "",
    yearsOfExperience: "",
    toursConducted: "",
    regionsOperated: "",
    tourTypes: [],
    servicesOffered: [],
    tourismTravelLicenseExpiry: "",
    liabilityInsuranceExpiry: "",
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
      navigate("/operator/login", { replace: true });
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
    for (let i = 0; i < STEP_CONFIG.length; i += 1) {
      if (!validateStep(i)) {
        setStepIndex(i);
        setError("Please complete all required fields before submitting.");
        return;
      }
    }

    const hasErrors = Object.values(fileErrors).some((v) => v);
    if (hasErrors) {
      setError("Please fix errors before submitting.");
      return;
    }
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        formData.append(k, v.join(","));
      } else {
        formData.append(k, v);
      }
    });
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

  const renderTextField = ({
    key,
    label,
    placeholder,
    type = "text",
    required = true,
    full = false,
  }) => {
    const hasError = Boolean(fieldErrors[key]);
    return (
      <div key={key} className={full ? "sm:col-span-2" : ""}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
        <input
          type={type}
          required={required}
          value={form[key]}
          onChange={(e) => {
            const val = e.target.value;
            setForm((prev) => ({ ...prev, [key]: val }));
            setFieldErrors((prev) => ({ ...prev, [key]: "" }));
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-all ${
            hasError
              ? "border-red-300 focus:ring-red-200 focus:border-red-400"
              : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
          }`}
        />
        {hasError && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {fieldErrors[key]}
          </p>
        )}
      </div>
    );
  };

  const renderTextarea = ({
    key,
    label,
    placeholder,
    required = true,
    full = true,
  }) => {
    const hasError = Boolean(fieldErrors[key]);
    return (
      <div key={key} className={full ? "sm:col-span-2" : ""}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
        <textarea
          required={required}
          value={form[key]}
          onChange={(e) => {
            const val = e.target.value;
            setForm((prev) => ({ ...prev, [key]: val }));
            setFieldErrors((prev) => ({ ...prev, [key]: "" }));
          }}
          placeholder={placeholder}
          rows={4}
          className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-all resize-none ${
            hasError
              ? "border-red-300 focus:ring-red-200 focus:border-red-400"
              : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
          }`}
        />
        {hasError && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {fieldErrors[key]}
          </p>
        )}
      </div>
    );
  };

  const renderUpload = (key) => {
    const cfg = DOCUMENTS[key];
    const file = files[key];
    const err = fileErrors[key];
    const isDragging = dragOverKey === key;
    const previewUrl = previews[key];
    const kind = getFileKind(file);

    return (
      <div key={key}>
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {cfg.label}
            {cfg.required && <span className="text-red-500"> *</span>}
          </label>
          {previewUrl && (
            <button
              type="button"
              onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
              className="text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              Preview
            </button>
          )}
        </div>
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverKey(key);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverKey(key);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverKey("");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverKey("");
            const dropped = e.dataTransfer?.files?.[0];
            if (dropped) handleFileChange(key, dropped);
          }}
          className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${
            file
              ? "border-teal-400 bg-teal-50"
              : err
              ? "border-red-300 bg-red-50"
              : isDragging
              ? "border-teal-400 bg-teal-50"
              : "border-gray-200 hover:border-teal-300"
          }`}
        >
          <input
            type="file"
            accept={cfg.accept}
            onChange={(e) => handleFileChange(key, e.target.files?.[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {file ? (
                <>
                  {kind === "image" ? (
                    <div className="w-10 h-10 rounded-lg bg-white border border-teal-100 overflow-hidden flex-shrink-0">
                      <img
                        src={previewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-teal-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-teal-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {cfg.allowed?.every((t) => t.startsWith("image/")) ? (
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">
                      <span className="text-teal-600 font-medium">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      {cfg.accept.replaceAll(".", "").toUpperCase()} up to 5 MB
                    </p>
                  </div>
                </>
              )}
            </div>
            {file && (
              <button
                type="button"
                onClick={() => {
                  setFiles((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                  setFileErrors((prev) => ({ ...prev, [key]: "" }));
                  setPreviews((prev) => {
                    const next = { ...prev };
                    const prevUrl = next[key];
                    if (prevUrl) {
                      try {
                        URL.revokeObjectURL(prevUrl);
                      } catch {
                        null;
                      }
                    }
                    delete next[key];
                    return next;
                  });
                }}
                className="text-xs font-medium text-gray-500 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        {err && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {err}
          </p>
        )}
      </div>
    );
  };

  const renderStep = () => {
    if (stepIndex === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">
            {STEP_CONFIG[0].title}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {renderTextField({
              key: "businessName",
              label: "Business Name",
              placeholder: "Acme Tours Pvt. Ltd.",
              full: true,
            })}
            {renderTextField({
              key: "registeredAddress",
              label: "GST Registered Address",
              placeholder: "123 MG Road, Mumbai 400001",
              full: true,
            })}
            {renderTextField({
              key: "officeAddress",
              label: "Office Address",
              placeholder: "Office address (if different from GST address)",
              full: true,
            })}
            {renderTextField({
              key: "gstin",
              label: "GSTIN",
              placeholder: "22AAAAA0000A1Z5",
            })}
            {renderTextField({
              key: "pan",
              label: "PAN Number",
              placeholder: "AAAAA0000A",
            })}
            {renderTextField({
              key: "tan",
              label: "TAN Number",
              placeholder: "AAAA00000A",
            })}
          </div>
        </div>
      );
    }

    if (stepIndex === 1) {
      return (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5">
              Bank Details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderTextField({
                key: "bankAccountNumber",
                label: "Bank Account Number",
                placeholder: "000123456789",
                full: true,
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              Legal Documents
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Upload PDF or image files. Max 5 MB each.
            </p>
            <div className="space-y-4">
              {[
                "gstCertificate",
                "pan",
                "tan",
                "incorporationCertificate",
                "bankProof",
                "authorizedSignatoryIdProof",
                "officeAddressProof",
              ].map(renderUpload)}
            </div>
          </div>
        </>
      );
    }

    if (stepIndex === 2) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Travel Verification
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            These documents are required to verify your travel business.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
            {renderTextField({
              key: "tourismTravelLicenseExpiry",
              label: "Tourism/Travel License Expiry (Optional)",
              placeholder: "",
              type: "date",
              required: false,
              full: true,
            })}
            {renderTextField({
              key: "liabilityInsuranceExpiry",
              label: "Liability Insurance Expiry (Optional)",
              placeholder: "",
              type: "date",
              required: false,
              full: true,
            })}
          </div>

          <div className="space-y-4">
            {[
              "tourismTravelLicense",
              "industryAssociationCertificate",
              "liabilityInsuranceCertificate",
            ].map(renderUpload)}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">
            Profile Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {renderTextarea({
              key: "businessInfo",
              label: "Business Information",
              placeholder:
                "Tell customers about your company, specialization, and what makes your tours unique.",
              full: true,
            })}
            {renderTextField({
              key: "yearsOfExperience",
              label: "Years of Experience",
              placeholder: "5",
              type: "number",
              full: false,
            })}
            {renderTextField({
              key: "toursConducted",
              label: "Number of Tours Conducted",
              placeholder: "120",
              type: "number",
              full: false,
            })}
            {renderTextField({
              key: "regionsOperated",
              label: "Countries/States Operated",
              placeholder: "India, Nepal, Dubai",
              full: true,
            })}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tour Types <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TOUR_TYPES.map((t) => (
                  <label
                    key={t.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                      form.tourTypes.includes(t.key)
                        ? "border-teal-400 bg-teal-50 text-teal-700"
                        : "border-gray-200 hover:border-teal-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.tourTypes.includes(t.key)}
                      onChange={() => {
                        setArrayToggle("tourTypes", t.key);
                        setFieldErrors((prev) => ({ ...prev, tourTypes: "" }));
                      }}
                      className="accent-teal-600"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
              {fieldErrors.tourTypes && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.tourTypes}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services Offered <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SERVICES.map((s) => (
                  <label
                    key={s.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                      form.servicesOffered.includes(s.key)
                        ? "border-teal-400 bg-teal-50 text-teal-700"
                        : "border-gray-200 hover:border-teal-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.servicesOffered.includes(s.key)}
                      onChange={() => {
                        setArrayToggle("servicesOffered", s.key);
                        setFieldErrors((prev) => ({
                          ...prev,
                          servicesOffered: "",
                        }));
                      }}
                      className="accent-teal-600"
                    />
                    {s.label}
                  </label>
                ))}
              </div>
              {fieldErrors.servicesOffered && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.servicesOffered}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Branding (Optional)
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Add a logo and cover banner to make your marketplace listing look professional.
          </p>
          <div className="space-y-4">{["companyLogo", "coverBanner"].map(renderUpload)}</div>
        </div>
      </>
    );
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
              navigate("/operator/login", { replace: true });
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
            const isActive = i === 1; // Onboarding is step index 1
            const isDone = i === 0; // Register is done
            return (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isDone
                        ? "bg-teal-500 border-teal-500"
                        : isActive
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
                      isActive ? "text-teal-600" : isDone ? "text-teal-500" : "text-gray-400"
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
          {renderStep()}

          {loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="mt-2 w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={loading || stepIndex === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {stepIndex < STEP_CONFIG.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-teal-500/30"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-teal-500/30"
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
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
