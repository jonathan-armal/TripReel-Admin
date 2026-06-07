import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { adminOperatorsAPI } from "../services/api";

const TABS = [
  {
    id: "APPROVED",
    label: "Approved",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    id: "PENDING_APPROVAL",
    label: "Pending Approval",
    icon: Clock,
    color: "text-amber-600",
  },
  {
    id: "SUSPENDED",
    label: "Suspended",
    icon: AlertTriangle,
    color: "text-red-600",
  },
  {
    id: "REUPLOAD",
    label: "Re-verification",
    icon: RefreshCw,
    color: "text-orange-600",
  },
  {
    id: "all",
    label: "All Operators",
    icon: Building2,
    color: "text-gray-600",
  },
];

const STATE_LABELS = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  ACTIVE_FULL: "Approved",
};

const STATE_COLORS = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  ACTIVE_FULL: "bg-green-100 text-green-700",
};

function StateBadge({ state }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATE_COLORS[state] || "bg-gray-100 text-gray-700"}`}
    >
      {STATE_LABELS[state] || state}
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

export default function Operators() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("APPROVED");
  const [page, setPage] = useState(1);
  const [tabCounts, setTabCounts] = useState({});
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch tab counts
  const fetchCounts = useCallback(async () => {
    try {
      const [approved, activeFull, pending, suspended, all] = await Promise.all(
        [
          adminOperatorsAPI.getAll({ state: "APPROVED", limit: 1 }),
          adminOperatorsAPI.getAll({ state: "ACTIVE_FULL", limit: 1 }),
          adminOperatorsAPI.getAll({ state: "PENDING_APPROVAL", limit: 1 }),
          adminOperatorsAPI.getAll({ state: "SUSPENDED", limit: 1 }),
          adminOperatorsAPI.getAll({ limit: 1 }),
        ],
      );
      setTabCounts({
        APPROVED: (approved.data.total || 0) + (activeFull.data.total || 0),
        PENDING_APPROVAL: pending.data.total,
        SUSPENDED: suspended.data.total,
        all: all.data.total,
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;

      if (activeTab === "APPROVED") {
        // Fetch both APPROVED and ACTIVE_FULL (legacy state)
        const [approvedRes, activeFullRes] = await Promise.all([
          adminOperatorsAPI.getAll({ ...params, state: "APPROVED" }),
          adminOperatorsAPI.getAll({ ...params, state: "ACTIVE_FULL" }),
        ]);
        const combined = [
          ...(approvedRes.data.operators || []),
          ...(activeFullRes.data.operators || []),
        ];
        setOperators(combined);
        setTotal(
          (approvedRes.data.total || 0) + (activeFullRes.data.total || 0),
        );
      } else if (activeTab === "REUPLOAD") {
        params.state = "PENDING_APPROVAL";
        const res = await adminOperatorsAPI.getAll(params);
        let ops = res.data.operators;
        ops = ops.filter((op) => {
          const hist = op.transitionHistory || [];
          const hadRejection = hist.some(
            (h) => h.toState === "REJECTED" || h.note?.includes("Re-upload"),
          );
          const hasReuploadedDoc =
            op.documentStatus &&
            Object.values(op.documentStatus).some(
              (d) => d.status === "PENDING" && hist.length > 1,
            );
          return hadRejection || hasReuploadedDoc;
        });
        setOperators(ops);
        setTotal(ops.length);
      } else if (activeTab !== "all") {
        params.state = activeTab;
        const res = await adminOperatorsAPI.getAll(params);
        setOperators(res.data.operators);
        setTotal(res.data.total);
      } else {
        const res = await adminOperatorsAPI.getAll(params);
        setOperators(res.data.operators);
        setTotal(res.data.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load operators.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeTab]);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
          <p className="text-sm text-gray-500">
            Manage operator verification and approvals
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
                isActive
                  ? "border-primary-500 text-primary-600 bg-primary-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : ""}`} />
              {tab.label}
              {count !== undefined && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or business…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : operators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Building2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No operators found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Business
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Contact
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Registered
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Documents
                  </th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">
                    View
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {operators.map((op) => {
                  const docStatus = op.documentStatus || {};
                  const totalDocs = Object.keys(docStatus).length;
                  const approvedDocs = Object.values(docStatus).filter(
                    (d) => d.status === "APPROVED",
                  ).length;
                  const pendingDocs = Object.values(docStatus).filter(
                    (d) => d.status === "PENDING",
                  ).length;
                  const rejectedDocs = Object.values(docStatus).filter(
                    (d) =>
                      d.status === "REJECTED" ||
                      d.status === "REUPLOAD_REQUIRED",
                  ).length;

                  return (
                    <tr
                      key={op._id}
                      className="hover:bg-primary-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/operators/${op._id}`)}
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {op.businessName || (
                          <span className="text-gray-400 italic">
                            Not provided
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {op.contactName}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{op.email}</td>
                      <td className="px-5 py-3.5">
                        <StateBadge state={op.onboardingState} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {formatDate(op.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        {totalDocs > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {approvedDocs > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                {approvedDocs}✓
                              </span>
                            )}
                            {pendingDocs > 0 && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                {pendingDocs}⏳
                              </span>
                            )}
                            {rejectedDocs > 0 && (
                              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                {rejectedDocs}✗
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/operators/${op._id}`);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{" "}
              of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
