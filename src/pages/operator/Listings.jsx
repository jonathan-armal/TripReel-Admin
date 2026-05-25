import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { operatorListingsAPI, operatorTemplatesAPI } from "../../services/api";

const STATUS_LABELS = {
  PENDING: "Pending Review",
  NEEDS_REVISION: "Needs Revision",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  NEEDS_REVISION: "bg-orange-100 text-orange-700 border-orange-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const inp =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all";

function TagListEditor({ label, values, onChange }) {
  const update = (i, val) => {
    const a = [...values];
    a[i] = val;
    onChange(a);
  };
  const add = () => onChange([...values, ""]);
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input value={v} onChange={(e) => update(i, e.target.value)} className={inp} />
          {values.length > 1 && (
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-teal-600 hover:underline font-medium">
        + Add
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        STATUS_COLORS[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

const emptyForm = {
  templateId: "",
  hotelName: "",
  hotelCategory: "",
  meals: [""],
  inclusions: [""],
  exclusions: [""],
  basePrice: "",
  gstMode: "GST_5_NO_ITC",
  tcsRate: 0,
  cancellationPolicy: "",
};

function ListingModal({ templates, listing, onClose, onSaved }) {
  const isEdit = !!listing;
  const [form, setForm] = useState(() => {
    if (!listing) return emptyForm;
    return {
      templateId: listing.templateId?._id || listing.templateId || "",
      hotelName: listing.hotel?.name || "",
      hotelCategory: listing.hotel?.category || "",
      meals: listing.meals?.length ? listing.meals : [""],
      inclusions: listing.inclusions?.length ? listing.inclusions : [""],
      exclusions: listing.exclusions?.length ? listing.exclusions : [""],
      basePrice: listing.basePrice ?? "",
      gstMode: listing.gstMode || "GST_5_NO_ITC",
      tcsRate: listing.tcsRate ?? 0,
      cancellationPolicy: listing.cancellationPolicy || "",
    };
  });

  const [tab, setTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((t) => t._id === form.templateId),
    [templates, form.templateId]
  );

  const save = async () => {
    if (!form.templateId || !form.basePrice) {
      setError("Template and price are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        templateId: form.templateId,
        hotel: { name: form.hotelName.trim(), category: form.hotelCategory.trim() },
        meals: (form.meals || []).filter(Boolean),
        inclusions: (form.inclusions || []).filter(Boolean),
        exclusions: (form.exclusions || []).filter(Boolean),
        basePrice: Number(form.basePrice),
        gstMode: form.gstMode,
        tcsRate: Number(form.tcsRate || 0),
        cancellationPolicy: form.cancellationPolicy,
      };

      const res = isEdit
        ? await operatorListingsAPI.update(listing._id, payload)
        : await operatorListingsAPI.create(payload);
      onSaved(res.data.listing);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = ["basic", "details"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? "Edit Listing" : "Create Listing"}
            </h2>
            {selectedTemplate && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {selectedTemplate.destinationName} · {selectedTemplate.theme} · {selectedTemplate.durationLabel}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t ? "border-teal-500 text-teal-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {tab === "basic" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Template *</label>
                <select
                  value={form.templateId}
                  disabled={isEdit}
                  onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
                  className={inp}
                >
                  <option value="">Select a template…</option>
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.destinationName} · {t.theme} · {t.durationLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hotel Name</label>
                <input
                  value={form.hotelName}
                  onChange={(e) => setForm((f) => ({ ...f, hotelName: e.target.value }))}
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hotel Category</label>
                <input
                  value={form.hotelCategory}
                  onChange={(e) => setForm((f) => ({ ...f, hotelCategory: e.target.value }))}
                  placeholder="e.g. 3 Star / 5 Star / Villa"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price (₹) *</label>
                <input
                  type="number"
                  value={form.basePrice}
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">GST Mode</label>
                <select
                  value={form.gstMode}
                  onChange={(e) => setForm((f) => ({ ...f, gstMode: e.target.value }))}
                  className={inp}
                >
                  <option value="GST_5_NO_ITC">5% (No ITC)</option>
                  <option value="GST_18_ITC">18% (With ITC)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">TCS Rate (%)</label>
                <input
                  type="number"
                  value={form.tcsRate}
                  onChange={(e) => setForm((f) => ({ ...f, tcsRate: e.target.value }))}
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cancellation Policy</label>
                <textarea
                  rows={3}
                  value={form.cancellationPolicy}
                  onChange={(e) => setForm((f) => ({ ...f, cancellationPolicy: e.target.value }))}
                  className={inp + " resize-none"}
                />
              </div>
            </div>
          )}

          {tab === "details" && (
            <div className="space-y-5">
              <TagListEditor label="Meals" values={form.meals} onChange={(v) => setForm((f) => ({ ...f, meals: v }))} />
              <TagListEditor label="Inclusions" values={form.inclusions} onChange={(v) => setForm((f) => ({ ...f, inclusions: v }))} />
              <TagListEditor label="Exclusions" values={form.exclusions} onChange={(v) => setForm((f) => ({ ...f, exclusions: v }))} />
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" /> {isEdit ? "Save Changes" : "Submit for Review"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OperatorListings() {
  const [templates, setTemplates] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalListing, setModalListing] = useState(undefined);
  const [viewListing, setViewListing] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [tplRes, listRes] = await Promise.all([
        operatorTemplatesAPI.getAll({ isActive: true, limit: 100 }),
        operatorListingsAPI.getMine(),
      ]);
      setTemplates(tplRes.data.templates || []);
      setListings(listRes.data.listings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaved = (listing) => {
    setListings((prev) => {
      const exists = prev.find((p) => p._id === listing._id);
      return exists ? prev.map((p) => (p._id === listing._id ? listing : p)) : [listing, ...prev];
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await operatorListingsAPI.delete(id);
      setListings((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create listings from templates and submit for admin review
          </p>
        </div>
        <button
          onClick={() => setModalListing(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Listing
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <ClipboardList className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No listings yet</p>
          <p className="text-xs mt-1">Click "New Listing" to create your first one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map((l) => (
            <div
              key={l._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {l.templateId ? `${l.templateId.destinationName} · ${l.templateId.theme}` : "Template"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {l.templateId?.durationLabel || "—"} · ₹{Number(l.basePrice).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>

                {l.adminNotes && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg border text-xs ${
                      l.status === "NEEDS_REVISION"
                        ? "bg-orange-50 border-orange-200 text-orange-700"
                        : l.status === "REJECTED"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-green-50 border-green-200 text-green-700"
                    }`}
                  >
                    <p className="font-semibold mb-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Admin Note
                    </p>
                    <p>{l.adminNotes}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {(l.status === "PENDING" || l.status === "NEEDS_REVISION") && (
                    <button
                      onClick={() => setModalListing(l)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {l.status === "NEEDS_REVISION" ? "Fix & Resubmit" : "Edit"}
                    </button>
                  )}
                  <button
                    onClick={() => setViewListing(l)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  {l.status !== "APPROVED" && (
                    <button
                      onClick={() => handleDelete(l._id)}
                      className="px-3 py-2 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalListing !== undefined && (
        <ListingModal
          templates={templates}
          listing={modalListing}
          onClose={() => setModalListing(undefined)}
          onSaved={handleSaved}
        />
      )}

      {viewListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewListing(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">
                  {viewListing.templateId
                    ? `${viewListing.templateId.destinationName} · ${viewListing.templateId.theme}`
                    : "Listing"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  ₹{Number(viewListing.basePrice).toLocaleString()} · {STATUS_LABELS[viewListing.status] || viewListing.status}
                </p>
              </div>
              <button onClick={() => setViewListing(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Hotel", viewListing.hotel?.name || "—"],
                  ["Category", viewListing.hotel?.category || "—"],
                  ["GST", viewListing.gstMode === "GST_18_ITC" ? "18% (With ITC)" : "5% (No ITC)"],
                  ["TCS", `${viewListing.tcsRate ?? 0}%`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {viewListing.inclusions?.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Inclusions</p>
                  <ul className="space-y-1">
                    {viewListing.inclusions.filter(Boolean).map((x, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewListing.exclusions?.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Exclusions</p>
                  <ul className="space-y-1">
                    {viewListing.exclusions.filter(Boolean).map((x, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                        <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewListing.cancellationPolicy && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cancellation</p>
                  <p className="text-sm text-gray-700">{viewListing.cancellationPolicy}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

