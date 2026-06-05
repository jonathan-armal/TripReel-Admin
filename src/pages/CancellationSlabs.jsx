import { useState, useEffect } from "react";
import {
  Percent,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { platformSettingsAPI } from "../services/api";

export default function CancellationSlabs() {
  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSlabs();
  }, []);

  const fetchSlabs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformSettingsAPI.getAll();
      const settings = res.data.settings || [];
      const slabSetting = settings.find(
        (s) => s.key === "cancellation_refund_slabs",
      );
      if (slabSetting && Array.isArray(slabSetting.value)) {
        setSlabs(slabSetting.value);
      } else {
        setSlabs([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load slabs");
    } finally {
      setLoading(false);
    }
  };

  const handleSlabChange = (index, field, value) => {
    setSlabs((prev) =>
      prev.map((slab, i) =>
        i === index ? { ...slab, [field]: Number(value) || 0 } : slab,
      ),
    );
    setSuccess("");
  };

  const handleAddSlab = () => {
    setSlabs((prev) => [...prev, { daysBeforeTrip: 0, refundPercent: 0 }]);
    setSuccess("");
  };

  const handleRemoveSlab = (index) => {
    setSlabs((prev) => prev.filter((_, i) => i !== index));
    setSuccess("");
  };

  const handleSave = async () => {
    // Validate
    for (const slab of slabs) {
      if (slab.daysBeforeTrip < 0) {
        setError("Days before trip cannot be negative");
        return;
      }
      if (slab.refundPercent < 0 || slab.refundPercent > 100) {
        setError("Refund percentage must be between 0 and 100");
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // Sort by days descending before saving
      const sorted = [...slabs].sort(
        (a, b) => b.daysBeforeTrip - a.daysBeforeTrip,
      );
      await platformSettingsAPI.update("cancellation_refund_slabs", sorted);
      setSlabs(sorted);
      setSuccess("Cancellation slabs saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save slabs");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <Percent className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cancellation Slabs
          </h1>
          <p className="text-sm text-gray-500">
            Configure refund percentages based on days before trip start
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Refund Slabs
            </h2>
            <p className="text-xs text-gray-400">
              Higher days = more refund. Sorted automatically on save.
            </p>
          </div>
          <button
            onClick={fetchSlabs}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Table Header */}
          {slabs.length > 0 && (
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 mb-3 px-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Days Before Trip
              </p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Refund %
              </p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                &nbsp;
              </p>
            </div>
          )}

          {/* Slab Rows */}
          <div className="space-y-3">
            {slabs.length === 0 ? (
              <div className="text-center py-8">
                <Percent className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No slabs configured</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add slabs to define cancellation refund tiers
                </p>
              </div>
            ) : (
              slabs.map((slab, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center bg-gray-50 rounded-xl p-4 border border-gray-100"
                >
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={slab.daysBeforeTrip}
                      onChange={(e) =>
                        handleSlabChange(
                          index,
                          "daysBeforeTrip",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
                      placeholder="Days"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      days
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={slab.refundPercent}
                      onChange={(e) =>
                        handleSlabChange(index, "refundPercent", e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
                      placeholder="Refund %"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      %
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveSlab(index)}
                    className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove slab"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddSlab}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-teal-600 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Slab
          </button>

          {/* Error / Success Messages */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || slabs.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving…" : "Save Slabs"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
