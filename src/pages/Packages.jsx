import { useState, useEffect, useCallback } from "react";
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
  X,
} from "lucide-react";
import { adminPackagesAPI } from "../services/api";

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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function InfoBlock({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="font-medium text-gray-800 text-sm">{value || "—"}</p>
    </div>
  );
}

// ── Package Detail + Review Modal ─────────────────────────────────────────────
function ReviewModal({ pkg, onClose, onReviewed }) {
  const [action, setAction] = useState("");
  const [adminNotes, setAdminNotes] = useState(pkg.adminNotes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action) {
      setError("Select an action.");
      return;
    }
    if (
      (action === "reject" || action === "needs_revision") &&
      adminNotes.trim().length < 5
    ) {
      setError("Please add a note (min 5 chars) explaining the issue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await adminPackagesAPI.review(pkg._id, {
        action,
        adminNotes: adminNotes.trim(),
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {pkg.title}
              </h2>
              <StatusBadge status={pkg.status} />
            </div>
            {pkg.operatorId && (
              <p className="text-xs text-gray-400">
                By{" "}
                <span className="font-medium text-gray-600">
                  {pkg.operatorId.businessName || pkg.operatorId.contactName}
                </span>
                {" · "}
                {pkg.operatorId.email}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Photos */}
          {(pkg.image_url || pkg.images?.length > 0) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Photos
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[pkg.image_url, ...(pkg.images || [])]
                  .filter(Boolean)
                  .map((url, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`photo ${i + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500 text-white">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Core info */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock label="Country" value={pkg.country || "India"} />
            {pkg.state && <InfoBlock label="State" value={pkg.state} />}
            {pkg.city && <InfoBlock label="City" value={pkg.city} />}
            <InfoBlock
              label="Location"
              value={pkg.destination || pkg.location}
            />
            <InfoBlock label="Duration" value={pkg.duration} />
            <InfoBlock label="Departure City" value={pkg.departureCity} />
            <InfoBlock label="Tour Type" value={pkg.tourType} />
          </div>

          {/* About This Trip */}
          {(pkg.aboutThisTrip || pkg.fullDescription || pkg.about) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                About This Trip
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {pkg.aboutThisTrip || pkg.fullDescription || pkg.about}
              </p>
            </div>
          )}

          {/* Pricing */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Pricing
            </p>
            <div className="grid grid-cols-2 gap-3">
              <InfoBlock
                label="Adult Price"
                value={
                  pkg.pricing?.adultPrice
                    ? `₹${Number(pkg.pricing.adultPrice).toLocaleString()}`
                    : pkg.price
                      ? `₹${Number(pkg.price).toLocaleString()}`
                      : null
                }
              />
              <InfoBlock
                label="Child Price"
                value={
                  pkg.pricing?.childPrice
                    ? `₹${Number(pkg.pricing.childPrice).toLocaleString()}`
                    : null
                }
              />
              {pkg.priceLabel && (
                <InfoBlock
                  label="Price per Person"
                  value={`₹${pkg.priceLabel}`}
                />
              )}
            </div>
          </div>

          {/* Highlights */}
          {pkg.highlights?.filter(Boolean).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Highlights
              </p>
              <ul className="space-y-1">
                {pkg.highlights.filter(Boolean).map((h, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Inclusions + Exclusions */}
          {(pkg.inclusions?.filter(Boolean).length > 0 ||
            pkg.exclusions?.filter(Boolean).length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {pkg.inclusions?.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Inclusions
                  </p>
                  <ul className="space-y-1">
                    {pkg.inclusions.filter(Boolean).map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-green-700"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pkg.exclusions?.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Exclusions
                  </p>
                  <ul className="space-y-1">
                    {pkg.exclusions.filter(Boolean).map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-red-600"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Addons */}
          {pkg.addons?.filter((a) => a.name).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Add-Ons
              </p>
              <div className="space-y-2">
                {pkg.addons
                  .filter((a) => a.name)
                  .map((addon, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {addon.name}
                        </p>
                        {addon.details?.filter(Boolean).length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {addon.details.filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-teal-600">
                        ₹{Number(addon.price || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
              {pkg.outsideCityCharge > 0 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium">
                    ⚡ Outside City Surcharge: ₹
                    {Number(pkg.outsideCityCharge).toLocaleString()} extra per
                    person per outside-city day
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Itinerary */}
          {pkg.itinerary?.filter((d) => d.title).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Itinerary
              </p>
              <div className="space-y-2">
                {pkg.itinerary
                  .filter((d) => d.title)
                  .map((day, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 flex-1">
                          Day {day.day}: {day.title}
                        </p>
                        {day.isOutsideCity && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Outside City
                          </span>
                        )}
                      </div>
                      {day.pickupPoint && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 Pickup: {day.pickupPoint}
                        </p>
                      )}
                      {day.points?.filter(Boolean).length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {day.points.filter(Boolean).map((pt, pi) => (
                            <li
                              key={pi}
                              className="text-xs text-gray-600 flex items-start gap-1.5"
                            >
                              <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0 mt-1.5" />
                              {pt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
              {pkg.outsideCityCharge > 0 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium">
                    Outside City Surcharge: ₹
                    {Number(pkg.outsideCityCharge).toLocaleString()} / person /
                    day
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Hotel & Transport */}
          {(pkg.hotelDetails?.hotelName ||
            pkg.transportDetails?.flightIncluded ||
            pkg.transportDetails?.busIncluded ||
            pkg.transportDetails?.cabIncluded ||
            pkg.transportDetails?.vehicleType) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Hotel & Transport
              </p>
              <div className="grid grid-cols-2 gap-3">
                {pkg.hotelDetails?.hotelName && (
                  <>
                    <InfoBlock
                      label="Hotel"
                      value={pkg.hotelDetails.hotelName}
                    />
                    <InfoBlock
                      label="Hotel Category"
                      value={pkg.hotelDetails.hotelCategory}
                    />
                    <InfoBlock
                      label="Room Type"
                      value={pkg.hotelDetails.roomType}
                    />
                    <InfoBlock
                      label="Meal Plan"
                      value={pkg.hotelDetails.mealPlan}
                    />
                  </>
                )}
                {pkg.transportDetails && (
                  <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 uppercase mb-1">
                      Transport
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {pkg.transportDetails.flightIncluded && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          Flight ✓
                        </span>
                      )}
                      {pkg.transportDetails.busIncluded && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          Bus ✓
                        </span>
                      )}
                      {pkg.transportDetails.cabIncluded && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          Cab ✓
                        </span>
                      )}
                      {pkg.transportDetails.vehicleType && (
                        <span className="text-gray-700">
                          {pkg.transportDetails.vehicleType}
                        </span>
                      )}
                      {pkg.transportDetails.pickupDrop && (
                        <span className="text-gray-700">
                          {pkg.transportDetails.pickupDrop}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Availability / Batches */}
          {pkg.batches?.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Trip Batches ({pkg.batches.length})
              </p>
              <div className="space-y-2">
                {pkg.batches.map((b, i) => {
                  const total = b.availableSeats || 0;
                  const booked = b.bookedSeats || 0;
                  const remaining = total - booked;
                  return (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          {b.label || `Batch ${i + 1}`}
                        </span>
                        {remaining <= 0 && total > 0 && (
                          <span className="ml-auto text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-semibold">
                            FULL
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <InfoBlock
                          label="Start Date"
                          value={formatDate(b.startDate)}
                        />
                        <InfoBlock
                          label="End Date"
                          value={formatDate(b.endDate)}
                        />
                        <InfoBlock
                          label="Available Seats"
                          value={String(total)}
                        />
                        <InfoBlock
                          label="Booked / Left"
                          value={`${booked} booked · ${Math.max(0, remaining)} left`}
                        />
                        {b.bookingDeadline && (
                          <div className="col-span-2">
                            <InfoBlock
                              label="Booking Deadline"
                              value={formatDate(b.bookingDeadline)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : pkg.availability &&
            (pkg.availability.startDate || pkg.availability.availableSeats) ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Availability
              </p>
              <div className="grid grid-cols-2 gap-3">
                {pkg.availability.startDate && (
                  <InfoBlock
                    label="Start Date"
                    value={formatDate(pkg.availability.startDate)}
                  />
                )}
                {pkg.availability.endDate && (
                  <InfoBlock
                    label="End Date"
                    value={formatDate(pkg.availability.endDate)}
                  />
                )}
                {pkg.availability.availableSeats > 0 && (
                  <InfoBlock
                    label="Available Seats"
                    value={String(pkg.availability.availableSeats)}
                  />
                )}
                {pkg.availability.bookingDeadline && (
                  <InfoBlock
                    label="Booking Deadline"
                    value={formatDate(pkg.availability.bookingDeadline)}
                  />
                )}
              </div>
            </div>
          ) : null}

          {/* Policies */}
          {(pkg.policies?.cancellationPolicy ||
            pkg.policies?.refundPolicy ||
            pkg.policies?.terms) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Policies
              </p>
              <div className="space-y-2">
                {pkg.policies.cancellationPolicy && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">
                      Cancellation Policy
                    </p>
                    <p className="text-sm text-gray-700">
                      {pkg.policies.cancellationPolicy}
                    </p>
                  </div>
                )}
                {pkg.policies.refundPolicy && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">
                      Refund Policy
                    </p>
                    <p className="text-sm text-gray-700">
                      {pkg.policies.refundPolicy}
                    </p>
                  </div>
                )}
                {pkg.policies.terms && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">
                      Terms & Conditions
                    </p>
                    <p className="text-sm text-gray-700">
                      {pkg.policies.terms}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Previous admin note */}
          {pkg.adminNotes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 mb-1">
                Previous Admin Note
              </p>
              <p className="text-sm text-amber-800">{pkg.adminNotes}</p>
            </div>
          )}

          {/* Review form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 border-t border-gray-100 pt-5"
          >
            <p className="text-sm font-semibold text-gray-800">
              Review Decision
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "approve",
                  label: "Approve",
                  icon: CheckCircle,
                  style:
                    "border-green-300 bg-green-50 text-green-700 hover:bg-green-100",
                },
                {
                  value: "needs_revision",
                  label: "Needs Revision",
                  icon: MessageSquare,
                  style:
                    "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100",
                },
                {
                  value: "reject",
                  label: "Reject",
                  icon: XCircle,
                  style:
                    "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
                },
              ].map(({ value, label, icon: Icon, style }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAction(value);
                    setError("");
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${style} ${action === value ? "ring-2 ring-offset-1 ring-current" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {action === "approve"
                  ? "Note for operator (optional)"
                  : "Note for operator (required)"}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder={
                  action === "needs_revision"
                    ? "Explain what needs to be fixed…"
                    : action === "reject"
                      ? "Explain why this package is being rejected…"
                      : "Optional note for the operator…"
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                    <CheckCircle className="w-4 h-4" /> Approve Package
                  </>
                ) : action === "reject" ? (
                  <>
                    <XCircle className="w-4 h-4" /> Reject Package
                  </>
                ) : action === "needs_revision" ? (
                  <>
                    <MessageSquare className="w-4 h-4" /> Request Revision
                  </>
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [reviewPkg, setReviewPkg] = useState(null);
  const [counts, setCounts] = useState({});
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
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

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const statuses = [
          "PENDING",
          "NEEDS_REVISION",
          "APPROVED",
          "REJECTED",
          "DRAFT",
          "EXPIRED",
        ];
        const results = await Promise.all(
          statuses.map((s) => adminPackagesAPI.getAll({ status: s, limit: 1 })),
        );
        const c = {};
        statuses.forEach((s, i) => {
          c[s] = results[i].data.total;
        });
        setCounts(c);
      } catch {}
    };
    fetchCounts();
  }, [packages]);

  const handleReviewed = (updated) => {
    setPackages((prev) =>
      prev.map((p) => (p._id === updated._id ? updated : p)),
    );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Package Review</h1>
          <p className="text-sm text-gray-500">
            Review and approve operator-submitted packages
          </p>
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
            onClick={() => {
              setStatusFilter(value);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              statusFilter === value
                ? "bg-primary-500 text-white border-primary-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600"
            }`}
          >
            {label}
            {value !== "all" && counts[value] !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${statusFilter === value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}
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
          <div className="p-4 bg-red-50 border-b border-red-100 text-sm text-red-600">
            {error}
          </div>
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
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Package
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Operator
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Price
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Submitted
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {packages.map((pkg) => (
                  <tr
                    key={pkg._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
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
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">
                            {pkg.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {[pkg.city, pkg.state, pkg.country]
                              .filter(Boolean)
                              .join(", ") || pkg.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {pkg.operatorId ? (
                        <div>
                          <p className="font-medium text-gray-800">
                            {pkg.operatorId.businessName ||
                              pkg.operatorId.contactName}
                          </p>
                          <p className="text-gray-400">
                            {pkg.operatorId.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Admin</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      ₹{Number(pkg.price).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <StatusBadge status={pkg.status} />
                        {pkg.adminNotes && (
                          <p
                            className="text-xs text-gray-400 max-w-[160px] truncate"
                            title={pkg.adminNotes}
                          >
                            Note: {pkg.adminNotes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {formatDate(pkg.createdAt)}
                    </td>
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
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{" "}
              of {total}
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
          onClose={() => setReviewPkg(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
}
