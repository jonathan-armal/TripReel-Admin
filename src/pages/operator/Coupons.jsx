import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Tag,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { operatorCouponsAPI, operatorBatchesAPI } from "../../services/api";

const inp =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all";

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const emptyForm = {
  batchId: "",
  code: "",
  type: "percentage",
  value: "",
  maxDiscount: "",
  minGuests: "",
  minOrderAmount: "",
  usageLimit: "",
  validUntil: "",
  description: "",
};

// ── Coupon Form Modal ─────────────────────────────────────────────────────────
function CouponModal({ coupon, batches, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    coupon
      ? {
          batchId: coupon.batchId?._id || coupon.batchId || "",
          code: coupon.code || "",
          type: coupon.type || "percentage",
          value: coupon.value ?? "",
          maxDiscount: coupon.maxDiscount ?? "",
          minGuests: coupon.minGuests ?? "",
          minOrderAmount: coupon.minOrderAmount ?? "",
          usageLimit: coupon.usageLimit ?? "",
          validUntil: coupon.validUntil
            ? new Date(coupon.validUntil).toISOString().split("T")[0]
            : "",
          description: coupon.description || "",
        }
      : emptyForm,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) =>
    setForm((f) => {
      const updated = { ...f, [k]: v };
      // Auto-generate description based on entered values
      const parts = [];
      if (updated.type === "percentage" && updated.value) {
        let desc = `Get ${updated.value}% off`;
        if (updated.maxDiscount && Number(updated.maxDiscount) > 0)
          desc += ` (max ₹${updated.maxDiscount})`;
        parts.push(desc);
      } else if (updated.type === "flat" && updated.value) {
        parts.push(`Get ₹${updated.value} off`);
      }
      if (updated.minGuests && Number(updated.minGuests) > 0) {
        parts.push(`for ${updated.minGuests}+ guests`);
      }
      if (updated.minOrderAmount && Number(updated.minOrderAmount) > 0) {
        parts.push(`on orders above ₹${updated.minOrderAmount}`);
      }
      const autoDesc = parts.join(" ");
      // Only auto-fill if description is empty or was previously auto-generated
      if (k !== "description" && autoDesc) {
        if (!f.description || f.description === f._prevAutoDesc) {
          updated.description = autoDesc;
        }
        updated._prevAutoDesc = autoDesc;
      }
      return updated;
    });

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.batchId) {
      setError("Select a batch");
      return;
    }
    if (!form.code.trim()) {
      setError("Coupon code is required");
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      setError("Discount value is required");
      return;
    }
    if (!form.validUntil) {
      setError("Expiry date is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        batchId: form.batchId,
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        maxDiscount: Number(form.maxDiscount) || 0,
        minGuests: Number(form.minGuests) || 0,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        validUntil: form.validUntil,
        description: form.description.trim(),
      };
      if (coupon) {
        await operatorCouponsAPI.update(coupon._id, payload);
      } else {
        await operatorCouponsAPI.create(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {coupon ? "Edit Coupon" : "Create Coupon"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Batch selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Batch *
            </label>
            <select
              value={form.batchId}
              onChange={(e) => set("batchId", e.target.value)}
              className={inp}
            >
              <option value="">Select a batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.packageId?.title || "Package"} — {fmt(b.startDate)} to{" "}
                  {fmt(b.endDate)} {b.label ? `(${b.label})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Code + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Coupon Code *
              </label>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="GOA20"
                className={inp}
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Discount Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className={inp}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
          </div>

          {/* Value + Max Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {form.type === "percentage"
                  ? "Percentage (%) *"
                  : "Amount (₹) *"}
              </label>
              <input
                type="number"
                min="0"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder={form.type === "percentage" ? "20" : "500"}
                className={inp}
              />
            </div>
            {form.type === "percentage" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => set("maxDiscount", e.target.value)}
                  placeholder="2000 (0 = no cap)"
                  className={inp}
                />
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Guests
              </label>
              <input
                type="number"
                min="0"
                value={form.minGuests}
                onChange={(e) => set("minGuests", e.target.value)}
                placeholder="5 (0 = no min)"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Order (₹)
              </label>
              <input
                type="number"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) => set("minOrderAmount", e.target.value)}
                placeholder="5000 (0 = no min)"
                className={inp}
              />
            </div>
          </div>

          {/* Usage + Expiry */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
                placeholder="50 (0 = unlimited)"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Valid Until *
              </label>
              <input
                type="date"
                value={form.validUntil}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => set("validUntil", e.target.value)}
                className={inp}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description (shown to users)
            </label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Book for 5+ guests, get 20% off (max ₹2000)"
              className={inp}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-600 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {coupon ? "Update" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OperatorCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, bRes] = await Promise.all([
        operatorCouponsAPI.getMine(),
        operatorBatchesAPI.getMine(),
      ]);
      setCoupons(cRes.data.coupons || []);
      setBatches(bRes.data.batches || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await operatorCouponsAPI.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
            <p className="text-sm text-gray-500">
              Create discount codes for your batches
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditCoupon(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 text-sm"
        >
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No coupons yet</p>
          <p className="text-sm mt-1">
            Create your first coupon to offer discounts to travelers
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((c) => {
            const isExpired = new Date(c.validUntil) < new Date();
            const isExhausted = c.usageLimit > 0 && c.usedCount >= c.usageLimit;
            return (
              <div
                key={c._id}
                className={`bg-white rounded-2xl border shadow-sm p-5 ${isExpired || isExhausted ? "opacity-60 border-gray-200" : "border-gray-100"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-teal-50 border border-teal-200 rounded-lg text-sm font-bold text-teal-700 tracking-wide">
                        {c.code}
                      </span>
                      {isExpired && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                          Expired
                        </span>
                      )}
                      {isExhausted && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                          Exhausted
                        </span>
                      )}
                      {!isExpired && !isExhausted && c.isActive && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-gray-800 mt-2">
                      {c.type === "percentage"
                        ? `${c.value}% OFF`
                        : `₹${c.value} OFF`}
                      {c.maxDiscount > 0 && c.type === "percentage" ? (
                        <span className="text-xs font-normal text-gray-400 ml-2">
                          max ₹{c.maxDiscount}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setEditCoupon(c);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {c.description && (
                  <p className="text-sm text-gray-600 mb-3">{c.description}</p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {c.minGuests > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> Min {c.minGuests} guests
                    </span>
                  )}
                  {c.minOrderAmount > 0 && <span>Min ₹{c.minOrderAmount}</span>}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Expires {fmt(c.validUntil)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {c.packageId?.title} — {fmt(c.batchId?.startDate)}
                  </span>
                  <span className="text-xs font-semibold text-gray-600">
                    Used: {c.usedCount}
                    {c.usageLimit > 0 ? `/${c.usageLimit}` : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CouponModal
          coupon={editCoupon}
          batches={batches}
          onClose={() => {
            setShowModal(false);
            setEditCoupon(null);
          }}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
