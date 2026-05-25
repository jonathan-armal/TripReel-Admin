import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  X,
  Tag,
  ChevronDown,
} from "lucide-react";
import { adminPackagesAPI, categoriesAPI } from "../services/api";

const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING: "Pending Review",
  NEEDS_REVISION: "Needs Revision",
  APPROVED: "Published",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

const STATUS_COLORS = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  NEEDS_REVISION: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-700",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        STATUS_COLORS[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Package Detail + Review Modal ─────────────────────────────────────────────
function ReviewModal({ pkg, categories, onClose, onReviewed }) {
  const [action, setAction] = useState(""); // 'approve' | 'reject' | 'needs_revision'
  const [adminNotes, setAdminNotes] = useState(pkg.adminNotes || "");
  const [approvedCategory, setApprovedCategory] = useState(
    pkg.approvedCategory || pkg.category || ""
  );
  const [isFeatured, setIsFeatured] = useState(Boolean(pkg.isFeatured));
  const [isTrending, setIsTrending] = useState(Boolean(pkg.isTrending));
  const [badge, setBadge] = useState(pkg.badge || "Popular");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action) { setError("Select an action."); return; }
    if ((action === "reject" || action === "needs_revision") && adminNotes.trim().length < 5) {
      setError("Please add a note (min 5 chars) explaining the issue.");
      return;
    }
    if (action === "approve" && !approvedCategory) {
      setError("Select a category before approving.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await adminPackagesAPI.review(pkg._id, {
        action,
        adminNotes: adminNotes.trim(),
        approvedCategory: action === "approve" ? approvedCategory : undefined,
        isFeatured: action === "approve" ? isFeatured : undefined,
        isTrending: action === "approve" ? isTrending : undefined,
        badge: action === "approve" ? badge : undefined,
      });
      onReviewed(res.data.package);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-900 truncate">{pkg.title}</h2>
              <StatusBadge status={pkg.status} />
            </div>
            <p className="text-sm text-gray-500">
              {pkg.location} · {pkg.duration} ·{" "}
              <span className="font-medium text-gray-700">
                ₹{Number(pkg.price).toLocaleString()}
              </span>
            </p>
            {pkg.operatorId && (
              <p className="text-xs text-gray-400 mt-1">
                By:{" "}
                <span className="font-medium text-gray-600">
                  {pkg.operatorId.businessName || pkg.operatorId.contactName}
                </span>{" "}
                · {pkg.operatorId.email}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Cover image */}
          {pkg.image_url && (
            <img
              src={pkg.image_url}
              alt={pkg.title}
              className="w-full h-48 object-cover rounded-xl"
            />
          )}

          {/* Package details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Category", pkg.category || "—"],
              ["Badge", pkg.badge || "—"],
              ["Duration", pkg.duration || "—"],
              ["Price", pkg.price ? `₹${Number(pkg.price).toLocaleString()}` : "—"],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {(pkg.destination || pkg.departureCity || (pkg.categories || []).length > 0) && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Destination", pkg.destination || pkg.location || "—"],
                ["Departure City", pkg.departureCity || "—"],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="font-medium text-gray-800">{value}</p>
                </div>
              ))}
              <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Package Categories</p>
                <p className="font-medium text-gray-800">
                  {(pkg.categories || []).filter(Boolean).join(", ") || "—"}
                </p>
              </div>
            </div>
          )}

          {pkg.description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700">{pkg.description}</p>
            </div>
          )}

          {pkg.about && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About</p>
              <p className="text-sm text-gray-700">{pkg.about}</p>
            </div>
          )}

          {pkg.highlights?.filter(Boolean).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Highlights</p>
              <ul className="space-y-1">
                {pkg.highlights.filter(Boolean).map((h, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pkg.inclusions?.filter(Boolean).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Inclusions</p>
              <ul className="space-y-1">
                {pkg.inclusions.filter(Boolean).map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pkg.itinerary?.filter((d) => d.title).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Itinerary</p>
              <div className="space-y-2">
                {pkg.itinerary.filter((d) => d.title).map((day, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm font-semibold text-gray-800">
                      Day {day.day}: {day.title}
                    </p>
                    {day.points?.filter(Boolean).length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {day.points.filter(Boolean).map((pt, pi) => (
                          <li key={pi} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0 mt-1.5" />
                            {pt}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous admin note */}
          {pkg.adminNotes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 mb-1">Previous Admin Note</p>
              <p className="text-sm text-amber-800">{pkg.adminNotes}</p>
            </div>
          )}

          {action === "approve" && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-sm font-semibold text-gray-800 mb-3">Publish Options</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Badge</label>
                  <select value={badge} onChange={(e) => setBadge(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="Popular">Popular</option>
                    <option value="Trending">Trending</option>
                    <option value="New">New</option>
                    <option value="">None</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm cursor-pointer">
                  <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="accent-teal-600" />
                  Featured
                </label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm cursor-pointer">
                  <input type="checkbox" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)} className="accent-teal-600" />
                  Trending
                </label>
              </div>
            </div>
          )}

          {/* Review form */}
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-800">Review Decision</p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: "approve", label: "Approve", icon: CheckCircle, style: "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" },
                { value: "needs_revision", label: "Needs Revision", icon: MessageSquare, style: "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100" },
                { value: "reject", label: "Reject", icon: XCircle, style: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" },
              ].map(({ value, label, icon: Icon, style }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setAction(value); setError(""); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${style} ${
                    action === value ? "ring-2 ring-offset-1 ring-current" : ""
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Category selector (approve only) */}
            {action === "approve" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Tag className="w-3.5 h-3.5 inline mr-1" />
                  Assign to Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={approvedCategory}
                    onChange={(e) => setApprovedCategory(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="">Select a category…</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {action === "approve" ? "Note for operator (optional)" : "Note for operator (required)"}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder={
                  action === "needs_revision"
                    ? "Explain what needs to be fixed, e.g. 'Hero image is low quality, please re-upload'…"
                    : action === "reject"
                    ? "Explain why this package is being rejected…"
                    : "Optional note for the operator…"
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !action}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  action === "approve"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : action === "reject"
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : action === "approve" ? (
                  <><CheckCircle className="w-4 h-4" /> Approve Package</>
                ) : action === "reject" ? (
                  <><XCircle className="w-4 h-4" /> Reject Package</>
                ) : action === "needs_revision" ? (
                  <><MessageSquare className="w-4 h-4" /> Request Revision</>
                ) : (
                  "Submit Decision"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PackageReview() {
  const [packages, setPackages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [reviewPkg, setReviewPkg] = useState(null);
  const limit = 20;

  useEffect(() => {
    categoriesAPI.getAll().then((r) => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await adminPackagesAPI.getAll(params);
      setPackages(res.data.packages);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load packages.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const handleReviewed = (updated) => {
    setPackages((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this package permanently?")) return;
    try {
      await adminPackagesAPI.delete(id);
      setPackages((prev) => prev.filter((p) => p._id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Counts per status for tabs
  const [counts, setCounts] = useState({});
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const statuses = ["PENDING", "NEEDS_REVISION", "APPROVED", "REJECTED", "DRAFT", "EXPIRED"];
        const results = await Promise.all(
          statuses.map((s) => adminPackagesAPI.getAll({ status: s, limit: 1 }))
        );
        const c = {};
        statuses.forEach((s, i) => { c[s] = results[i].data.total; });
        setCounts(c);
      } catch {}
    };
    fetchCounts();
  }, [packages]); // refresh counts when packages change

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Package Review</h1>
          <p className="text-sm text-gray-500">Review and approve operator-submitted packages</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All" },
          { value: "PENDING", label: "Pending" },
          { value: "NEEDS_REVISION", label: "Needs Revision" },
          { value: "APPROVED", label: "Published" },
          { value: "REJECTED", label: "Rejected" },
          { value: "DRAFT", label: "Draft" },
          { value: "EXPIRED", label: "Expired" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              statusFilter === value
                ? "bg-primary-500 text-white border-primary-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600"
            }`}
          >
            {label}
            {value !== "all" && counts[value] !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  statusFilter === value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {counts[value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search packages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No packages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Package</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Operator</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Price</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Submitted</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {packages.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {pkg.image_url ? (
                          <img
                            src={pkg.image_url}
                            alt={pkg.title}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">{pkg.title}</p>
                          <p className="text-xs text-gray-400 truncate">{pkg.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {pkg.operatorId ? (
                        <div>
                          <p className="font-medium text-gray-800">
                            {pkg.operatorId.businessName || pkg.operatorId.contactName}
                          </p>
                          <p className="text-gray-400">{pkg.operatorId.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Admin</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {pkg.approvedCategory || pkg.category || (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      ₹{Number(pkg.price).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <StatusBadge status={pkg.status} />
                        {pkg.adminNotes && (
                          <p className="text-xs text-gray-400 max-w-[160px] truncate" title={pkg.adminNotes}>
                            Note: {pkg.adminNotes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(pkg.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setReviewPkg(pkg)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                        <button
                          onClick={() => handleDelete(pkg._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewPkg && (
        <ReviewModal
          pkg={reviewPkg}
          categories={categories}
          onClose={() => setReviewPkg(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
}
