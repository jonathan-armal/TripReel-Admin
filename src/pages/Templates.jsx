import { useCallback, useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, Save, Layers, X } from "lucide-react";
import Modal from "../components/Modal";
import { templatesAPI } from "../services/api";
import { useApi } from "../hooks/useApi";

const inp =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm";

function ItineraryEditor({ value, onChange }) {
  const days = Array.isArray(value) ? value : [];
  const updateDay = (i, key, val) => {
    const a = [...days];
    a[i] = { ...a[i], [key]: val };
    onChange(a);
  };
  const updatePoint = (di, pi, val) => {
    const a = [...days];
    const pts = Array.isArray(a[di].points) ? [...a[di].points] : [""];
    pts[pi] = val;
    a[di] = { ...a[di], points: pts };
    onChange(a);
  };
  const addPoint = (di) => {
    const a = [...days];
    const pts = Array.isArray(a[di].points) ? [...a[di].points] : [];
    a[di] = { ...a[di], points: [...pts, ""] };
    onChange(a);
  };
  const removePoint = (di, pi) => {
    const a = [...days];
    const pts = Array.isArray(a[di].points) ? a[di].points : [];
    a[di] = { ...a[di], points: pts.filter((_, idx) => idx !== pi) };
    onChange(a);
  };
  const addDay = () => onChange([...days, { day: days.length + 1, title: "", points: [""] }]);
  const removeDay = (i) => onChange(days.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 })));

  return (
    <div className="space-y-3">
      {days.map((d, di) => (
        <div key={di} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center text-xs font-bold">
              {d.day || di + 1}
            </div>
            <input
              value={d.title || ""}
              onChange={(e) => updateDay(di, "title", e.target.value)}
              placeholder={`Day ${di + 1} title`}
              className={inp + " flex-1"}
            />
            {days.length > 1 && (
              <button
                type="button"
                onClick={() => removeDay(di)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="pl-10 space-y-2">
            {(Array.isArray(d.points) ? d.points : [""]).map((pt, pi) => (
              <div key={pi} className="flex gap-2">
                <input
                  value={pt || ""}
                  onChange={(e) => updatePoint(di, pi, e.target.value)}
                  placeholder="Point / activity"
                  className={inp + " flex-1"}
                />
                {((Array.isArray(d.points) ? d.points : []).length > 1) && (
                  <button
                    type="button"
                    onClick={() => removePoint(di, pi)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addPoint(di)} className="text-sm text-primary-600 hover:underline font-medium">
              + Add point
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addDay} className="text-sm text-primary-600 hover:underline font-medium">
        + Add day
      </button>
    </div>
  );
}

export default function Templates() {
  const { loading, error, run } = useApi();
  const [templates, setTemplates] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    destinationName: "",
    theme: "",
    nights: 0,
    days: 0,
    season: "",
    slug: "",
    seoPath: "",
    isActive: true,
    itinerarySkeleton: [{ day: 1, title: "", points: [""] }],
  });

  const fetchTemplates = useCallback(async () => {
    const params = { page, limit };
    if (search.trim()) params.search = search.trim();
    const res = await templatesAPI.getAll(params);
    setTemplates(res.data.templates || []);
    setTotal(res.data.total || 0);
  }, [page, search]);

  useEffect(() => {
    fetchTemplates().catch(() => {});
  }, [fetchTemplates]);

  const openNew = () => {
    setEditing(null);
    setForm({
      destinationName: "",
      theme: "",
      nights: 0,
      days: 0,
      season: "",
      slug: "",
      seoPath: "",
      isActive: true,
      itinerarySkeleton: [{ day: 1, title: "", points: [""] }],
    });
    setIsModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      destinationName: t.destinationName || "",
      theme: t.theme || "",
      nights: Number(t.nights || 0),
      days: Number(t.days || 0),
      season: Array.isArray(t.season) ? t.season.join(", ") : "",
      slug: t.slug || "",
      seoPath: t.seoPath || "",
      isActive: typeof t.isActive === "boolean" ? t.isActive : true,
      itinerarySkeleton: Array.isArray(t.itinerarySkeleton) && t.itinerarySkeleton.length
        ? t.itinerarySkeleton
        : [{ day: 1, title: "", points: [""] }],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.destinationName.trim() || !form.theme.trim()) return;

    const payload = {
      destinationName: form.destinationName.trim(),
      theme: form.theme.trim(),
      nights: Number(form.nights || 0),
      days: Number(form.days || 0),
      season: form.season
        ? form.season.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      slug: form.slug.trim() || undefined,
      seoPath: form.seoPath.trim() || undefined,
      isActive: !!form.isActive,
      itinerarySkeleton: (form.itinerarySkeleton || []).filter((d) => d.title?.trim()),
    };

    await run(async () => {
      if (editing) {
        await templatesAPI.update(editing._id, payload);
      } else {
        await templatesAPI.create(payload);
      }
      await fetchTemplates();
      closeModal();
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    await run(async () => {
      await templatesAPI.delete(id);
      await fetchTemplates();
    });
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500">Create base destination templates (Layer A)</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search destination / theme / slug…"
            className="bg-transparent outline-none flex-1 text-gray-700"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-sm text-red-600">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Destination</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Theme</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Duration</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">SEO Path</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Active</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No templates yet
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{t.destinationName}</td>
                    <td className="px-5 py-3.5 text-gray-700">{t.theme}</td>
                    <td className="px-5 py-3.5 text-gray-700">{t.durationLabel || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{t.seoPath || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {t.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm font-medium text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editing ? "Edit Template" : "New Template"}
      >
        <div className="space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination <span className="text-red-500">*</span>
              </label>
              <input
                value={form.destinationName}
                onChange={(e) => setForm((f) => ({ ...f, destinationName: e.target.value }))}
                placeholder="e.g. Bali"
                className={inp}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme <span className="text-red-500">*</span>
              </label>
              <input
                value={form.theme}
                onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
                placeholder="e.g. Honeymoon"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nights</label>
              <input
                type="number"
                value={form.nights}
                onChange={(e) => setForm((f) => ({ ...f, nights: Number(e.target.value) }))}
                className={inp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
              <input
                type="number"
                value={form.days}
                onChange={(e) => setForm((f) => ({ ...f, days: Number(e.target.value) }))}
                className={inp}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Season (comma separated)</label>
              <input
                value={form.season}
                onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
                placeholder="e.g. Summer, Winter"
                className={inp}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="Auto-generated if empty"
                className={inp}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Path (optional)</label>
              <input
                value={form.seoPath}
                onChange={(e) => setForm((f) => ({ ...f, seoPath: e.target.value }))}
                placeholder="Auto-generated if empty"
                className={inp}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={!!form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Itinerary Skeleton</label>
            <ItineraryEditor
              value={form.itinerarySkeleton}
              onChange={(itinerarySkeleton) => setForm((f) => ({ ...f, itinerarySkeleton }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !form.destinationName.trim() || !form.theme.trim()}
              className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

