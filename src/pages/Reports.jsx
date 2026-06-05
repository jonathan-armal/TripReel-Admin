import { useState, useEffect } from "react";
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Send,
  Filter,
} from "lucide-react";
import { reportsAPI } from "../services/api";

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  in_progress: {
    label: "In Progress",
    color: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  closed: {
    label: "Closed",
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
};

const TYPE_COLORS = {
  bug: "bg-red-50 text-red-600 border-red-200",
  complaint: "bg-orange-50 text-orange-600 border-orange-200",
  suggestion: "bg-blue-50 text-blue-600 border-blue-200",
  payment: "bg-purple-50 text-purple-600 border-purple-200",
  other: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [noteInputs, setNoteInputs] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.getAll();
      setReports(res.data.reports || res.data || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    setOpenDropdown(null);
    try {
      await reportsAPI.update(id, { status: newStatus });
      setReports((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r)),
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddNote = async (id) => {
    const note = noteInputs[id]?.trim();
    if (!note) return;
    setUpdatingId(id);
    try {
      await reportsAPI.update(id, { adminNote: note });
      setReports((prev) =>
        prev.map((r) => (r._id === id ? { ...r, adminNote: note } : r)),
      );
      setNoteInputs((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filters = ["all", "open", "in_progress", "resolved"];
  const filteredReports =
    activeFilter === "all"
      ? reports
      : reports.filter((r) => r.status === activeFilter);

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
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-sm">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Reports</h1>
          <p className="text-sm text-gray-500">
            {reports.length} total report{reports.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {filters.map((filter) => {
          const count =
            filter === "all"
              ? reports.length
              : reports.filter((r) => r.status === filter).length;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter === "all"
                ? "All"
                : STATUS_CONFIG[filter]?.label || filter}{" "}
              <span className="ml-1 opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No reports found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const statusConf =
              STATUS_CONFIG[report.status] || STATUS_CONFIG.open;
            const typeColor = TYPE_COLORS[report.type] || TYPE_COLORS.other;

            return (
              <div
                key={report._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {report.userName || report.user?.name || "Anonymous"}
                      </p>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${typeColor}`}
                      >
                        {report.type || "general"}
                      </span>
                    </div>
                    <p className="text-base font-medium text-gray-900 mb-1">
                      {report.subject || "No Subject"}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {report.description || report.message || "—"}
                    </p>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusConf.color}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`}
                      />
                      {statusConf.label}
                    </span>

                    {/* Status Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === report._id ? null : report._id,
                          )
                        }
                        disabled={updatingId === report._id}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </button>

                      {openDropdown === report._id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[140px]">
                          {STATUS_OPTIONS.map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                handleStatusUpdate(report._id, status)
                              }
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                report.status === status
                                  ? "text-teal-600 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              {STATUS_CONFIG[status]?.label || status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  {report.createdAt
                    ? new Date(report.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </div>

                {/* Existing Admin Note */}
                {report.adminNote && (
                  <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 mb-3">
                    <p className="text-xs text-teal-600 font-medium mb-0.5">
                      Admin Note
                    </p>
                    <p className="text-sm text-teal-800">{report.adminNote}</p>
                  </div>
                )}

                {/* Add Note */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={noteInputs[report._id] || ""}
                    onChange={(e) =>
                      setNoteInputs((prev) => ({
                        ...prev,
                        [report._id]: e.target.value,
                      }))
                    }
                    placeholder="Add a note..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddNote(report._id);
                    }}
                  />
                  <button
                    onClick={() => handleAddNote(report._id)}
                    disabled={
                      !noteInputs[report._id]?.trim() ||
                      updatingId === report._id
                    }
                    className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
