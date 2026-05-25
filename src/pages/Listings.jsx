import { useCallback, useEffect, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
  X,
  ClipboardList,
} from "lucide-react";
import { adminListingsAPI } from "../services/api";

const STATUS_LABELS = {
  PENDING: "Pending Review",
  NEEDS_REVISION: "Needs Revision",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  NEEDS_REVISION: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
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

function ReviewModal({ listing, onClose, onReviewed }) {
  const [action, setAction] = useState("");
  const [adminNotes, setAdminNotes] = useState(listing.adminNotes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action) {
      setError("Select an action.");
      return;
    }
    if ((action === "reject" || action === "needs_revision") && adminNotes.trim().length < 5) {
      setError("Please add a note (min 5 chars).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await adminListingsAPI.review(listing._id, {
        action,
        adminNotes: adminNotes.trim(),
      });
      onReviewed(res.data.listing);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const tpl = listing.templateId;
  const op = listing.operatorId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {tpl ? `${tpl.destinationName} · ${tpl.theme} · ${tpl.durationLabel || ""}` : "Listing"}
              </h2>
              <StatusBadge status={listing.status} />
            </div>
            <p className="text-sm text-gray-500">
              Hotel: {listing.hotel?.name || "—"} {listing.hotel?.category ? `(${listing.hotel.category})` : ""}
              {" · "}
              <span className="font-medium text-gray-700">
                ₹{Number(listing.basePrice).toLocaleString()}
              </span>
            </p>
            {op && (
              <p className="text-xs text-gray-400 mt-1">
                By: <span className="font-medium text-gray-600">{op.businessName || op.contactName}</span> · {op.email}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["GST Mode", listing.gstMode || "—"],
              ["GST Rate", `${listing.gstRate ?? "—"}%`],
              ["TCS Rate", `${listing.tcsRate ?? "—"}%`],
              ["Currency", listing.currency || "—"],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {Array.isArray(listing.inclusions) && listing.inclusions.filter(Boolean).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Inclusions</p>
              <ul className="space-y-1">
                {listing.inclusions.filter(Boolean).map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(listing.exclusions) && listing.exclusions.filter(Boolean).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Exclusions</p>
              <ul className="space-y-1">
                {listing.exclusions.filter(Boolean).map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                    <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {listing.cancellationPolicy && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cancellation</p>
              <p className="text-sm text-gray-700">{listing.cancellationPolicy}</p>
            </div>
          )}

          {listing.adminNotes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 mb-1">Previous Admin Note</p>
              <p className="text-sm text-amber-800">{listing.adminNotes}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-800">Review Decision</p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {action === "approve" ? "Note for operator (optional)" : "Note for operator (required)"}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
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
                  <>
                    <CheckCircle className="w-4 h-4" /> Approve Listing
                  </>
                ) : action === "reject" ? (
                  <>
                    <XCircle className="w-4 h-4" /> Reject Listing
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" /> Request Revision
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [reviewListing, setReviewListing] = useState(null);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await adminListingsAPI.getAll(params);
      setListings(res.data.listings || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleReviewed = (updated) => {
    setListings((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings Review</h1>
          <p className="text-sm text-gray-500">Review operator listings created from templates (Layer B)</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All" },
          { value: "PENDING", label: "Pending" },
          { value: "NEEDS_REVISION", label: "Needs Revision" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
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
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search listings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No listings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Template</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Operator</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Hotel</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Price</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Submitted</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((l) => {
                  const tpl = l.templateId;
                  const op = l.operatorId;
                  return (
                    <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[220px]">
                            {tpl ? `${tpl.destinationName} · ${tpl.theme}` : "—"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {tpl?.durationLabel || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">
                        {op ? (
                          <div>
                            <p className="font-medium text-gray-800">
                              {op.businessName || op.contactName}
                            </p>
                            <p className="text-gray-400">{op.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {l.hotel?.name || "—"} {l.hotel?.category ? <span className="text-gray-400">({l.hotel.category})</span> : null}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">
                        ₹{Number(l.basePrice).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <StatusBadge status={l.status} />
                          {l.adminNotes && (
                            <p className="text-xs text-gray-400 max-w-[180px] truncate" title={l.adminNotes}>
                              Note: {l.adminNotes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(l.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setReviewListing(l)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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

      {reviewListing && (
        <ReviewModal
          listing={reviewListing}
          onClose={() => setReviewListing(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
}

