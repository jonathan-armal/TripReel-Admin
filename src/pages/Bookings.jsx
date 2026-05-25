import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Eye,
  Calendar,
  MapPin,
  X,
  User,
  Mail,
  Hash,
  Tag,
  Receipt,
} from "lucide-react";
import { bookingsAPI } from "../services/api";

const statusConfig = {
  CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400", border: "border-red-200" },
  COMPLETED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
};

function BookingDrawer({ booking, onClose }) {
  if (!booking) return null;
  const st = statusConfig[booking.status] || statusConfig.PENDING;
  const userName = booking.userId?.name || "Unknown";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const tpl = booking.templateId || booking.snapshot?.template;
  const listing = booking.listingId || booking.snapshot?.listing;
  const pricing = booking.pricing || {};

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Booking Details</h2>
            <p className="text-xs text-gray-400 mt-0.5">#{booking.bookingId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${st.bg} ${st.text} ${st.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {booking.status}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-50 text-gray-600">
                Listing
              </span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Package</p>
              <p className="font-semibold text-gray-900">
                {tpl ? `${tpl.destinationName} · ${tpl.theme}` : "—"}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{tpl?.seoPath || "—"}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Hotel: {listing?.hotel?.name || listing?.hotel?.category ? `${listing?.hotel?.name || ""} ${listing?.hotel?.category ? `(${listing.hotel.category})` : ""}` : "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Base", value: `₹${Number(pricing.baseAmount || 0).toLocaleString()}` },
                { label: `GST (${pricing.gstRate || 0}%)`, value: `₹${Number(pricing.gstAmount || 0).toLocaleString()}` },
                { label: `TCS (${pricing.tcsRate || 0}%)`, value: `₹${Number(pricing.tcsAmount || 0).toLocaleString()}` },
                { label: "Total", value: `₹${Number(pricing.totalAmount || 0).toLocaleString()}` },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-2xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Customer</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700 flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <p className="font-semibold text-gray-800 text-sm truncate">{userName}</p>
                  </div>
                  {booking.userId?.email && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-500 truncate">{booking.userId.email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Booking Info</p>
              {[
                { icon: Hash, label: "Booking ID", value: booking.bookingId },
                {
                  icon: Calendar,
                  label: "Start Date",
                  value: booking.travelStartDate ? new Date(booking.travelStartDate).toLocaleDateString() : "—",
                },
                {
                  icon: Calendar,
                  label: "End Date",
                  value: booking.travelEndDate ? new Date(booking.travelEndDate).toLocaleDateString() : "—",
                },
                { icon: Tag, label: "Currency", value: pricing.currency || "INR" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{label}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </>
  );
}

function BookingRow({ booking, onView }) {
  const st = statusConfig[booking.status] || statusConfig.PENDING;
  const tpl = booking.templateId;
  return (
    <div className="group bg-white rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-px transition-all duration-200">
      <div className="flex items-center px-4 py-3 gap-3 flex-wrap md:flex-nowrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {tpl ? `${tpl.destinationName} · ${tpl.theme}` : booking.bookingId}
            </p>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${st.bg} ${st.text} ${st.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {booking.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
            <Receipt className="w-3 h-3 text-gray-400" />
            <span className="font-mono">{booking.bookingId}</span>
            {tpl?.durationLabel && <span className="text-gray-400">· {tpl.durationLabel}</span>}
          </div>
        </div>
        <div className="w-28 flex-shrink-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">
            ₹{Number(booking.pricing?.totalAmount || 0).toLocaleString()}
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => onView(booking)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-teal-300 hover:text-teal-600 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewBooking, setViewBooking] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter !== "all") params.status = statusFilter.toUpperCase();
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await bookingsAPI.getAll(params);
      setBookings(res.data.bookings || []);
    } catch (err) {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage marketplace bookings (Layer C)</p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Total", value: counts.all, color: "text-gray-900", bg: "bg-gray-50" },
            { label: "Confirmed", value: counts.confirmed, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Pending", value: counts.pending, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl px-4 py-2 text-center min-w-[70px]`}>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1 border border-gray-100">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by booking ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none flex-1 text-gray-700 text-sm placeholder:text-gray-400"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 text-sm outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="all">All Status ({counts.all})</option>
            <option value="confirmed">Confirmed ({counts.confirmed})</option>
            <option value="pending">Pending ({counts.pending})</option>
            <option value="cancelled">Cancelled ({counts.cancelled})</option>
          </select>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-2.5">
          {bookings.map((b) => (
            <BookingRow key={b._id} booking={b} onView={setViewBooking} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-700">No bookings found</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-sm">Try adjusting your search or filter.</p>
        </div>
      )}

      <BookingDrawer booking={viewBooking} onClose={() => setViewBooking(null)} />
    </div>
  );
}

