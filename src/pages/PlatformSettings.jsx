import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Percent,
  FileText,
  Shield,
  IndianRupee,
} from "lucide-react";
import { platformSettingsAPI, cronAPI } from "../services/api";

// Keys that are numeric (percentages)
const NUMERIC_KEYS = ["platform_fee_percent", "gst_percent"];

// Keys that are text (policies)
const TEXT_KEYS = [
  "default_cancellation_policy",
  "default_refund_policy",
  "default_terms",
];

const LABELS = {
  platform_fee_percent: "Platform Fee",
  gst_percent: "GST",
  default_cancellation_policy: "Default Cancellation Policy",
  default_refund_policy: "Default Refund Policy",
  default_terms: "Default Terms & Conditions",
};

const DESCRIPTIONS = {
  platform_fee_percent:
    "Percentage deducted from operator's earnings on each booking. Not charged to user.",
  gst_percent:
    "GST applied on booking subtotal. Added to user's total payment.",
  default_cancellation_policy:
    "Shown to users on the booking & package detail screens.",
  default_refund_policy: "Displayed in booking details and help sections.",
  default_terms: "Displayed in booking flow and package details.",
};

export default function PlatformSettings() {
  const [settings, setSettings] = useState([]);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [loading, setLoading] = useState(true);
  const [cronLoading, setCronLoading] = useState(false);
  const [cronResult, setCronResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await platformSettingsAPI.getAll();
      const s = res.data.settings || [];
      setSettings(s);
      const vals = {};
      s.forEach((item) => {
        vals[item.key] = String(item.value);
      });
      setEditing(vals);
    } catch (err) {
      console.warn("Settings fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key) => {
    const val = editing[key];

    // For numeric keys, validate
    if (NUMERIC_KEYS.includes(key)) {
      const num = Number(val);
      if (isNaN(num) || num < 0) {
        setErrors((e) => ({ ...e, [key]: "Must be a non-negative number" }));
        return;
      }
    }

    setSaving((s) => ({ ...s, [key]: true }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setSuccess((s) => ({ ...s, [key]: false }));
    try {
      const value = NUMERIC_KEYS.includes(key) ? Number(val) : val;
      await platformSettingsAPI.update(key, value);
      setSuccess((s) => ({ ...s, [key]: true }));
      setTimeout(() => setSuccess((s) => ({ ...s, [key]: false })), 2500);
      fetchSettings();
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [key]: err.response?.data?.message || "Save failed",
      }));
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const handleRunCron = async () => {
    setCronLoading(true);
    setCronResult(null);
    try {
      const res = await cronAPI.run();
      setCronResult({
        success: true,
        message: res.data.message,
        results: res.data.results,
      });
    } catch (err) {
      setCronResult({
        success: false,
        message: err.response?.data?.message || "Cron failed",
      });
    } finally {
      setCronLoading(false);
    }
  };

  const numericSettings = settings.filter((s) => NUMERIC_KEYS.includes(s.key));
  const textSettings = settings.filter((s) => TEXT_KEYS.includes(s.key));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Platform Settings
          </h1>
          <p className="text-sm text-gray-500">
            Configure fees, policies, and automated jobs
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Fee Configuration ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Fee Configuration
                </h2>
                <p className="text-xs text-gray-400">
                  Changes apply to new bookings only — existing bookings keep
                  original fees
                </p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {numericSettings.map((item) => (
                <div
                  key={item.key}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-700">
                      {LABELS[item.key] || item.label}
                    </p>
                    <span className="text-3xl font-bold text-teal-600">
                      {item.value}
                      <span className="text-lg text-teal-400">%</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    {DESCRIPTIONS[item.key] || ""}
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-teal-400 focus-within:border-teal-400">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={editing[item.key] ?? ""}
                        onChange={(e) =>
                          setEditing((ed) => ({
                            ...ed,
                            [item.key]: e.target.value,
                          }))
                        }
                        className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                        placeholder="Enter value"
                      />
                      <span className="px-3 text-sm text-gray-400 font-medium border-l border-gray-200">
                        %
                      </span>
                    </div>
                    <button
                      onClick={() => handleSave(item.key)}
                      disabled={saving[item.key]}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {saving[item.key] ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : success[item.key] ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      {success[item.key] ? "Saved" : "Save"}
                    </button>
                  </div>

                  {errors[item.key] && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      {errors[item.key]}
                    </div>
                  )}
                  {item.updatedAt && (
                    <p className="text-[11px] text-gray-400 mt-2">
                      Updated:{" "}
                      {new Date(item.updatedAt).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Default Policies ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Default Policies
                </h2>
                <p className="text-xs text-gray-400">
                  Shown to users on booking screens. Applied to all packages
                  unless operator overrides.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {textSettings.map((item) => (
                <div
                  key={item.key}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700">
                      {LABELS[item.key] || item.label}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    {DESCRIPTIONS[item.key] || ""}
                  </p>

                  {/* Current value display */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.value || (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </p>
                  </div>

                  {/* Edit field */}
                  <div className="flex items-start gap-2">
                    <textarea
                      value={editing[item.key] ?? ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          [item.key]: e.target.value,
                        }))
                      }
                      rows={3}
                      className="flex-1 px-3 py-2.5 text-sm outline-none border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 resize-none"
                      placeholder="Enter policy text..."
                    />
                    <button
                      onClick={() => handleSave(item.key)}
                      disabled={saving[item.key]}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {saving[item.key] ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : success[item.key] ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      {success[item.key] ? "Saved" : "Save"}
                    </button>
                  </div>

                  {errors[item.key] && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      {errors[item.key]}
                    </div>
                  )}
                  {item.updatedAt && (
                    <p className="text-[11px] text-gray-400 mt-2">
                      Updated:{" "}
                      {new Date(item.updatedAt).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Automated Jobs ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Automated Jobs
                </h2>
                <p className="text-xs text-gray-400">
                  Runs daily at midnight. Manually trigger below for immediate
                  execution.
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Booking Status Updater
                </h3>
                <ul className="text-xs text-gray-500 space-y-1.5 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                    Auto-completes CONFIRMED bookings where trip end date has
                    passed
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                    Credits operator wallet 2 days after trip completion
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                    Auto-cancels PENDING bookings past booking deadline
                  </li>
                </ul>

                <button
                  onClick={handleRunCron}
                  disabled={cronLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
                >
                  {cronLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {cronLoading ? "Running…" : "Run Now"}
                </button>
              </div>

              {cronResult && (
                <div
                  className={`mt-4 p-4 rounded-xl border text-sm ${
                    cronResult.success
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <p className="font-semibold">{cronResult.message}</p>
                  {cronResult.results?.errors?.length > 0 && (
                    <ul className="mt-2 text-xs list-disc list-inside">
                      {cronResult.results.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
