import { useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  CreditCard,
  Shield,
  Edit3,
  Save,
  CheckCircle,
  X,
  Camera,
} from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";
import { operatorAuthAPI } from "../../services/api";

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const SERVER = isLocal
  ? "http://localhost:5001"
  : "https://api.tripreel.in";

const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SERVER}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function OperatorProfile() {
  const { operator, refreshOperator } = useOperatorAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef(null);
  const [form, setForm] = useState({
    contactName: operator?.contactName || "",
    phone: operator?.phone || "",
    businessName: operator?.businessName || "",
    businessType: operator?.businessType || "",
    city: operator?.city || "",
    state: operator?.state || "",
    country: operator?.country || "",
    mainOperatingDestinations:
      operator?.mainOperatingDestinations?.join(", ") || "",
    upiId: operator?.upiId || "",
  });

  const handleSave = async () => {
    setSaving(true);
    setSuccess("");
    try {
      await operatorAuthAPI.updateProfile({
        contactName: form.contactName,
        phone: form.phone,
        businessName: form.businessName,
        businessType: form.businessType,
        city: form.city,
        state: form.state,
        country: form.country,
        mainOperatingDestinations: form.mainOperatingDestinations,
        upiId: form.upiId,
      });
      await refreshOperator();
      setSuccess("Profile updated successfully");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setSuccess("");
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      await operatorAuthAPI.uploadPhoto(fd);
      await refreshOperator();
      setSuccess("Photo updated");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!operator) return null;

  const infoSections = [
    {
      title: "Personal Information",
      icon: User,
      color: "bg-blue-50 text-blue-600",
      fields: [
        {
          label: "Contact Name",
          value: operator.contactName,
          key: "contactName",
        },
        { label: "Email", value: operator.email, readonly: true },
        { label: "Phone", value: operator.phone || "—", key: "phone" },
      ],
    },
    {
      title: "Business Information",
      icon: Building2,
      color: "bg-purple-50 text-purple-600",
      fields: [
        {
          label: "Business Name",
          value: operator.businessName || "—",
          key: "businessName",
        },
        {
          label: "Business Type",
          value: (operator.businessType || "—").replace(/_/g, " "),
          key: "businessType",
        },
        {
          label: "GST Number",
          value: operator.gstNumber || "Not provided",
          readonly: true,
        },
      ],
    },
    {
      title: "Location",
      icon: MapPin,
      color: "bg-teal-50 text-teal-600",
      fields: [
        { label: "City", value: operator.city || "—", key: "city" },
        { label: "State", value: operator.state || "—", key: "state" },
        { label: "Country", value: operator.country || "—", key: "country" },
        {
          label: "Operating Destinations",
          value: operator.mainOperatingDestinations?.join(", ") || "—",
          key: "mainOperatingDestinations",
        },
      ],
    },
    {
      title: "Bank Details",
      icon: CreditCard,
      color: "bg-emerald-50 text-emerald-600",
      fields: [
        {
          label: "Account Holder",
          value: operator.accountHolderName || "—",
          readonly: true,
        },
        { label: "Bank Name", value: operator.bankName || "—", readonly: true },
        {
          label: "Account Number",
          value: operator.accountNumber
            ? "••••" + operator.accountNumber.slice(-4)
            : "—",
          readonly: true,
        },
        { label: "IFSC Code", value: operator.ifscCode || "—", readonly: true },
        { label: "UPI ID", value: operator.upiId || "—", key: "upiId" },
      ],
    },
    {
      title: "Account Status",
      icon: Shield,
      color: "bg-amber-50 text-amber-600",
      fields: [
        {
          label: "Onboarding State",
          value: operator.onboardingState,
          readonly: true,
        },
        {
          label: "Member Since",
          value: operator.createdAt
            ? new Date(operator.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "—",
          readonly: true,
        },
        {
          label: "Documents Verified",
          value:
            operator.onboardingState === "APPROVED"
              ? "Yes ✓"
              : "Pending review",
          readonly: true,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group">
            {resolvePhoto(operator.profilePhoto) ? (
              <img
                src={resolvePhoto(operator.profilePhoto)}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm">
                {(operator.contactName || "O").charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-teal-600 transition-colors"
            >
              {uploading ? (
                <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {operator.contactName}
            </h1>
            <p className="text-sm text-gray-500">{operator.email}</p>
          </div>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-sm font-medium hover:bg-teal-100 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {infoSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg ${section.color} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-gray-800">
                  {section.title}
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {section.fields.map((field) => (
                  <div key={field.label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      {field.label}
                    </p>
                    {editing && field.key && !field.readonly ? (
                      <input
                        type="text"
                        value={form[field.key] || ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [field.key]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-800">
                        {field.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
