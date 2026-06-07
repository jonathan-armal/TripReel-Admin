import { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  Package,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Filter,
  FileText,
  Send,
  Download,
  X,
  Plus,
  Trash2,
  ArrowLeft,
  Search,
  Check,
  Hotel,
  Bus,
  MapPin,
  ListChecks,
} from "lucide-react";
import {
  operatorPackagesAPI,
  operatorBatchesAPI,
  operatorTripBookingsAPI,
  operatorChatAPI,
} from "../../services/api";

function fmt(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function fmtShort(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}
function fmtMoney(n) {
  return "\u20B9" + Number(n || 0).toLocaleString("en-IN");
}
function daysUntil(d) {
  if (!d) return Infinity;
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PDF DOCUMENT BUILDER VIEW
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function DocumentBuilder({ type, batch, batchBookings, pkg, onBack }) {
  // Clone all package data for editing (won't affect actual package)
  const [title, setTitle] = useState(pkg?.title || "");
  const [location, setLocation] = useState(pkg?.location || "");
  const [duration, setDuration] = useState(
    `${pkg?.durationDays || 0}D / ${pkg?.durationNights || 0}N`,
  );
  const [itinerary, setItinerary] = useState(
    (pkg?.itinerary || []).map((d) => ({
      ...d,
      points: [...(d.points || [])],
    })),
  );
  const [inclusions, setInclusions] = useState([...(pkg?.inclusions || [])]);
  const [exclusions, setExclusions] = useState([...(pkg?.exclusions || [])]);
  const [hotel, setHotel] = useState({
    hotelName: pkg?.hotelDetails?.hotelName || "",
    hotelCategory: pkg?.hotelDetails?.hotelCategory || "",
    roomType: pkg?.hotelDetails?.roomType || "",
    mealPlan: pkg?.hotelDetails?.mealPlan || "",
  });
  const [transport, setTransport] = useState({
    vehicleType: pkg?.transportDetails?.vehicleType || "",
    pickupDrop: pkg?.transportDetails?.pickupDrop || "",
    flightIncluded: pkg?.transportDetails?.flightIncluded || false,
    cabIncluded: pkg?.transportDetails?.cabIncluded || false,
  });
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [pickupPoint, setPickupPoint] = useState(
    pkg?.transportDetails?.pickupDrop || "",
  );
  const [specialNotes, setSpecialNotes] = useState("");
  const [extraFields, setExtraFields] = useState([]);

  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState("");

  // â”€â”€ Itinerary Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addItineraryPoint = (dayIdx) => {
    const updated = [...itinerary];
    updated[dayIdx].points.push("");
    setItinerary(updated);
  };
  const updateItineraryPoint = (dayIdx, pointIdx, val) => {
    const updated = [...itinerary];
    updated[dayIdx].points[pointIdx] = val;
    setItinerary(updated);
  };
  const removeItineraryPoint = (dayIdx, pointIdx) => {
    const updated = [...itinerary];
    updated[dayIdx].points.splice(pointIdx, 1);
    setItinerary(updated);
  };
  const addItineraryDay = () => {
    setItinerary([
      ...itinerary,
      { day: itinerary.length + 1, title: "", points: [] },
    ]);
  };

  // â”€â”€ Generate Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const generateContent = () => {
    let content = "";

    if (type === "internal") {
      content += `â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n`;
      content += `       INTERNAL TRIP DOCUMENT\n`;
      content += `â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n\n`;
    } else {
      content += `â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n`;
      content += `         YOUR TRIP DETAILS\n`;
      content += `â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n\n`;
    }

    content += `ðŸ“ ${title}\n`;
    content += `ðŸ“Œ ${location}\n`;
    content += `ðŸ“… ${fmt(batch.startDate)}  ->  ${fmt(batch.endDate)}\n`;
    content += `â±ï¸ ${duration}\n`;
    content += `ðŸ’° ${fmtMoney(batch.adultPrice)}/person\n`;
    if (batch.label) content += `ðŸ·ï¸ Batch: ${batch.label}\n`;
    content += `\n`;

    // Transport
    if (type === "internal" || vehicleNo || pickupPoint) {
      content += `â”€â”€ TRANSPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€\n`;
      if (transport.vehicleType)
        content += `Vehicle Type: ${transport.vehicleType}\n`;
      if (vehicleNo) content += `Vehicle No: ${vehicleNo}\n`;
      if (driverName) content += `Driver: ${driverName}\n`;
      if (driverPhone) content += `Driver Phone: ${driverPhone}\n`;
      if (pickupPoint) content += `Pickup: ${pickupPoint}\n`;
      if (transport.flightIncluded) content += `âœˆï¸ Flight Included\n`;
      if (transport.cabIncluded) content += `ðŸš— Cab Included\n`;
      content += `\n`;
    }

    // Hotel
    if (hotel.hotelName) {
      content += `â”€â”€ HOTEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€\n`;
      content += `ðŸ¨ ${hotel.hotelName}`;
      if (hotel.hotelCategory) content += ` (${hotel.hotelCategory})`;
      content += `\n`;
      if (hotel.roomType) content += `Room: ${hotel.roomType}\n`;
      if (hotel.mealPlan) content += `Meals: ${hotel.mealPlan}\n`;
      content += `\n`;
    }

    // Itinerary
    if (itinerary.length > 0) {
      content += `â”€â”€ ITINERARY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€\n`;
      itinerary.forEach((day) => {
        content += `\nDay ${day.day}: ${day.title}\n`;
        day.points.forEach((p) => {
          if (p) content += `  â€¢ ${p}\n`;
        });
      });
      content += `\n`;
    }

    // Inclusions
    if (inclusions.length > 0) {
      content += `â”€â”€ INCLUSIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€\n`;
      inclusions.forEach((inc) => {
        if (inc) content += `âœ“ ${inc}\n`;
      });
      content += `\n`;
    }

    // Exclusions
    if (exclusions.length > 0) {
      content += `â”€â”€ EXCLUSIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€\n`;
      exclusions.forEach((exc) => {
        if (exc) content += `âœ— ${exc}\n`;
      });
      content += `\n`;
    }

    // Internal: Traveler list
    if (type === "internal" && batchBookings.length > 0) {
      const totalPax = batchBookings.reduce(
        (s, b) => s + (b.travelers?.length || b.seats || 1),
        0,
      );
      content += `â”€â”€ TRAVELERS (${totalPax} total) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€\n`;
      batchBookings.forEach((booking, idx) => {
        content += `\n#${idx + 1} ${booking.userId?.name || "User"} (${booking.bookingId}) - ${booking.status}\n`;
        content += `   Phone: ${booking.userId?.phone || "-"} | Amount: ${fmtMoney(booking.pricing?.operatorAmount)}\n`;
        booking.travelers?.forEach((t, i) => {
          content += `   ${i + 1}. ${t.name || "-"} | ${t.gender || "-"} | Age ${t.age || "-"}\n`;
        });
      });
      content += `\n`;
    }

    // Special notes
    if (specialNotes) {
      content += `â”€â”€ IMPORTANT NOTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€\n`;
      content += `${specialNotes}\n\n`;
    }

    // Extra fields
    extraFields.forEach((f) => {
      if (f.label && f.value) content += `${f.label}: ${f.value}\n`;
    });

    if (type === "user") {
      content += `\nâ”€â”€ CONTACT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€\n`;
      content += `For any queries, please reach out via TripReel chat.\nHave a great trip! ðŸŽ‰\n`;
    }

    return content;
  };

  const handleDownload = () => {
    const content = generateContent();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type === "internal" ? "Internal" : "Trip"}_${title}_${fmtShort(batch.startDate)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendToUsers = async () => {
    setSending(true);
    setSendSuccess("");
    try {
      const content = generateContent();
      let sentCount = 0;
      for (const booking of batchBookings) {
        const userId = booking.userId?._id || booking.userId;
        if (!userId || booking.status === "CANCELLED") continue;
        try {
          await operatorChatAPI.sendMessage(userId, {
            text: `ðŸ“„ Trip Details - ${title}\n\n${content}`,
          });
          sentCount++;
        } catch {}
      }
      setSendSuccess(`âœ… Sent to ${sentCount} user(s) via chat!`);
    } catch {
      setSendSuccess("âŒ Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {type === "internal"
              ? "ðŸ“‹ Internal Trip Document"
              : "ðŸ“„ User Trip Document"}
          </h1>
          <p className="text-sm text-gray-500">
            {title} {"\u00B7"} {fmt(batch.startDate)} {"\u2192"}{" "}
            {fmt(batch.endDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Download
          </button>
          {type === "user" && (
            <button
              onClick={handleSendToUsers}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Sending..." : "Send to All Users"}
            </button>
          )}
        </div>
      </div>

      {sendSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          {sendSuccess}
        </div>
      )}

      <p className="text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        ðŸ’¡ Edit anything below - changes are only for this document, not your
        actual package. Add points, modify details, include extra info.
      </p>

      {/* Basic Info */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Package className="w-4 h-4 text-teal-500" /> Package Info
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Duration
            </label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Price/Person
            </label>
            <input
              value={batch.adultPrice}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </section>

      {/* Transport */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Bus className="w-4 h-4 text-blue-500" /> Transport
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Vehicle Type
            </label>
            <input
              value={transport.vehicleType}
              onChange={(e) =>
                setTransport((p) => ({ ...p, vehicleType: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Tempo Traveller / Bus / Car"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Vehicle Number
            </label>
            <input
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="KA 01 AB 1234"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Driver Name
            </label>
            <input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Driver Phone
            </label>
            <input
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Pickup / Drop Point
            </label>
            <input
              value={pickupPoint}
              onChange={(e) => setPickupPoint(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Address or landmark"
            />
          </div>
        </div>
      </section>

      {/* Hotel */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Hotel className="w-4 h-4 text-purple-500" /> Hotel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Hotel Name
            </label>
            <input
              value={hotel.hotelName}
              onChange={(e) =>
                setHotel((p) => ({ ...p, hotelName: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Category
            </label>
            <input
              value={hotel.hotelCategory}
              onChange={(e) =>
                setHotel((p) => ({ ...p, hotelCategory: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="3 Star / 4 Star"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Room Type
            </label>
            <input
              value={hotel.roomType}
              onChange={(e) =>
                setHotel((p) => ({ ...p, roomType: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Double / Triple sharing"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Meal Plan
            </label>
            <input
              value={hotel.mealPlan}
              onChange={(e) =>
                setHotel((p) => ({ ...p, mealPlan: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="MAP / AP / CP"
            />
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-500" /> Itinerary
          </h2>
          <button
            onClick={addItineraryDay}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Day
          </button>
        </div>
        {itinerary.map((day, dayIdx) => (
          <div
            key={dayIdx}
            className="border border-gray-100 rounded-lg p-3 bg-gray-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                Day {day.day}
              </span>
              <input
                value={day.title}
                onChange={(e) => {
                  const u = [...itinerary];
                  u[dayIdx].title = e.target.value;
                  setItinerary(u);
                }}
                className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Day title"
              />
            </div>
            <div className="space-y-1 ml-4">
              {day.points.map((point, pIdx) => (
                <div key={pIdx} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">â€¢</span>
                  <input
                    value={point}
                    onChange={(e) =>
                      updateItineraryPoint(dayIdx, pIdx, e.target.value)
                    }
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Activity / point"
                  />
                  <button
                    onClick={() => removeItineraryPoint(dayIdx, pIdx)}
                    className="text-red-300 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addItineraryPoint(dayIdx)}
                className="text-[11px] text-teal-600 hover:text-teal-700 font-medium ml-3"
              >
                + Add point
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Inclusions & Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-green-500" /> Inclusions
            </h2>
            <button
              onClick={() => setInclusions([...inclusions, ""])}
              className="text-xs text-teal-600 font-medium"
            >
              + Add
            </button>
          </div>
          {inclusions.map((inc, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-green-500 text-xs">âœ“</span>
              <input
                value={inc}
                onChange={(e) => {
                  const u = [...inclusions];
                  u[i] = e.target.value;
                  setInclusions(u);
                }}
                className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                onClick={() =>
                  setInclusions(inclusions.filter((_, idx) => idx !== i))
                }
                className="text-red-300 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </section>
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <X className="w-4 h-4 text-red-400" /> Exclusions
            </h2>
            <button
              onClick={() => setExclusions([...exclusions, ""])}
              className="text-xs text-teal-600 font-medium"
            >
              + Add
            </button>
          </div>
          {exclusions.map((exc, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-red-400 text-xs">âœ—</span>
              <input
                value={exc}
                onChange={(e) => {
                  const u = [...exclusions];
                  u[i] = e.target.value;
                  setExclusions(u);
                }}
                className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                onClick={() =>
                  setExclusions(exclusions.filter((_, idx) => idx !== i))
                }
                className="text-red-300 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </section>
      </div>

      {/* Travelers (Internal only) */}
      {type === "internal" && batchBookings.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" /> Travelers (
            {batchBookings.reduce((s, b) => s + (b.travelers?.length || 1), 0)}{" "}
            total)
          </h2>
          <div className="space-y-2">
            {batchBookings.map((booking, idx) => (
              <div
                key={booking._id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">
                    #{idx + 1} {booking.userId?.name || "User"} -{" "}
                    {booking.bookingId}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${booking.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs text-gray-500">
                  {booking.travelers?.map((t, i) => (
                    <span key={i}>
                      {t.name || "-"} {t.gender ? `(${t.gender})` : ""}{" "}
                      {t.age ? `Age ${t.age}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Special Notes + Extra Fields */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-800 text-sm">
          ðŸ“ Additional Notes & Custom Fields
        </h2>
        <textarea
          value={specialNotes}
          onChange={(e) => setSpecialNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          placeholder="Any important notes for this trip..."
        />
        {extraFields.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={f.label}
              onChange={(e) => {
                const u = [...extraFields];
                u[i].label = e.target.value;
                setExtraFields(u);
              }}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
              placeholder="Field name"
            />
            <input
              value={f.value}
              onChange={(e) => {
                const u = [...extraFields];
                u[i].value = e.target.value;
                setExtraFields(u);
              }}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
              placeholder="Value"
            />
            <button
              onClick={() =>
                setExtraFields(extraFields.filter((_, idx) => idx !== i))
              }
              className="p-2 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            setExtraFields([...extraFields, { label: "", value: "" }])
          }
          className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add Custom Field
        </button>
      </section>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 sticky bottom-0">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          â† Back to Batches
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Download Document
          </button>
          {type === "user" && (
            <button
              onClick={handleSendToUsers}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send to All Booked Users
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN BOOKING MANAGEMENT PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function OperatorAnalytics() {
  const [packages, setPackages] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPackage, setFilterPackage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");

  // Selected batch - full page detail view
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Document builder view
  const [docView, setDocView] = useState(null); // { type, batch, bookings, pkg }

  useEffect(() => {
    Promise.all([
      operatorPackagesAPI.getMine(),
      operatorBatchesAPI.getMine({ limit: 200 }),
      operatorTripBookingsAPI.getMine({ limit: 500 }),
    ])
      .then(([pkgRes, batchRes, bookRes]) => {
        setPackages(pkgRes.data?.packages || []);
        setAllBatches(batchRes.data?.batches || []);
        setBookings(bookRes.data?.bookings || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sortedBatches = useMemo(() => {
    let filtered = [...allBatches];
    if (filterPackage !== "all") {
      filtered = filtered.filter(
        (b) => (b.packageId?._id || b.packageId) === filterPackage,
      );
    }
    const now = new Date();
    if (filterStatus === "upcoming")
      filtered = filtered.filter((b) => new Date(b.startDate) > now);
    else if (filterStatus === "ongoing")
      filtered = filtered.filter(
        (b) => new Date(b.startDate) <= now && new Date(b.endDate) >= now,
      );
    else if (filterStatus === "completed")
      filtered = filtered.filter((b) => new Date(b.endDate) < now);

    filtered.sort((a, b) => {
      const now = new Date();
      const aUp = new Date(a.startDate) > now;
      const bUp = new Date(b.startDate) > now;
      if (aUp && !bUp) return -1;
      if (!aUp && bUp) return 1;
      if (aUp && bUp) return new Date(a.startDate) - new Date(b.startDate);
      return new Date(b.startDate) - new Date(a.startDate);
    });
    return filtered;
  }, [allBatches, filterPackage, filterStatus]);

  const getBatchBookings = (batchId) =>
    bookings.filter((b) => (b.batchId?._id || b.batchId) === batchId);
  const getPackageForBatch = (batch) =>
    packages.find((p) => p._id === (batch.packageId?._id || batch.packageId));
  const getBatchStatus = (batch) => {
    const now = new Date();
    const start = new Date(batch.startDate);
    const end = new Date(batch.endDate);
    if (!batch.isActive)
      return { label: "Inactive", color: "bg-gray-100 text-gray-600" };
    if (start > now)
      return {
        label: `Upcoming (${daysUntil(batch.startDate)}d)`,
        color: "bg-emerald-100 text-emerald-700",
      };
    if (start <= now && end >= now)
      return { label: "Ongoing", color: "bg-blue-100 text-blue-700" };
    return { label: "Completed", color: "bg-gray-100 text-gray-600" };
  };

  const openDocBuilder = (type, batch) => {
    const pkg = getPackageForBatch(batch);
    const batchBookings = getBatchBookings(batch._id);
    setDocView({ type, batch, bookings: batchBookings, pkg });
  };

  // â”€â”€ Document Builder View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (docView) {
    return (
      <DocumentBuilder
        type={docView.type}
        batch={docView.batch}
        batchBookings={docView.bookings}
        pkg={docView.pkg}
        onBack={() => setDocView(null)}
      />
    );
  }

  // â”€â”€ Batch Detail View (full page, not dropdown) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (selectedBatch) {
    const batch = selectedBatch;
    const pkg = getPackageForBatch(batch);
    const batchBookings = getBatchBookings(batch._id);
    const status = getBatchStatus(batch);
    const fillPercent =
      batch.totalSeats > 0
        ? Math.round(((batch.bookedSeats || 0) / batch.totalSeats) * 100)
        : 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedBatch(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                {pkg?.title || "-"}
              </h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}
              >
                {status.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {fmt(batch.startDate)} {"\u2192"} {fmt(batch.endDate)}{" "}
              {batch.label ? `\u00B7 ${batch.label}` : ""}
            </p>
          </div>
        </div>

        {/* Batch Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-indigo-200/50 p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-indigo-700">
              {fmtMoney(batch.adultPrice)}
            </p>
            <p className="text-xs text-indigo-500 font-medium">Per Person</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl border border-purple-200/50 p-5 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-20 h-2 bg-purple-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${fillPercent >= 90 ? "bg-red-400" : fillPercent >= 50 ? "bg-amber-400" : "bg-emerald-400"}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {batch.bookedSeats || 0}/{batch.totalSeats}
            </p>
            <p className="text-xs text-purple-500 font-medium">Seats Booked</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl border border-orange-200/50 p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-orange-700">
              {batchBookings.length}
            </p>
            <p className="text-xs text-orange-500 font-medium">Bookings</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl border border-emerald-200/50 p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-700">
              {fmtMoney(
                batchBookings.reduce(
                  (s, b) => s + (b.pricing?.operatorAmount || 0),
                  0,
                ),
              )}
            </p>
            <p className="text-xs text-emerald-500 font-medium">
              Your Earnings
            </p>
          </div>
        </div>

        {/* Document Actions */}
        <div className="flex flex-wrap gap-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-200 p-5">
          <button
            onClick={() => openDocBuilder("internal", batch)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
          >
            <FileText className="w-4 h-4" /> Generate Internal Document
          </button>
          <button
            onClick={() => openDocBuilder("user", batch)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-teal-200 transition-all hover:-translate-y-0.5"
          >
            <FileText className="w-4 h-4" /> Generate User Trip Document
          </button>
        </div>

        {/* All Bookings */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              All Bookings ({batchBookings.length})
            </h2>
          </div>
          {batchBookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No bookings for this batch yet
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {batchBookings.map((booking, idx) => (
                <div
                  key={booking._id}
                  className="p-5 border-l-4 border-l-teal-400"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {booking.userId?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {booking.bookingId} · {booking.userId?.phone || "-"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        booking.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-700"
                          : booking.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-700"
                            : booking.status === "CANCELLED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Seats</p>
                      <p className="font-medium text-gray-700">
                        {booking.seats || booking.travelers?.length || 1}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Amount</p>
                      <p className="font-medium text-gray-700">
                        {fmtMoney(booking.pricing?.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Your Earnings</p>
                      <p className="font-medium text-teal-700">
                        {fmtMoney(booking.pricing?.operatorAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Booked On</p>
                      <p className="font-medium text-gray-700">
                        {fmt(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                  {booking.travelers?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">
                        Travelers
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {booking.travelers.map((t, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-gray-600"
                          >
                            <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-medium text-gray-500 border border-gray-200">
                              {i + 1}
                            </span>
                            <span className="font-medium">{t.name || "-"}</span>
                            {t.gender && (
                              <span className="text-gray-400">
                                ({t.gender})
                              </span>
                            )}
                            {t.age > 0 && (
                              <span className="text-gray-400">Age {t.age}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage batches, view bookings & generate trip documents
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Package className="w-5 h-5 text-teal-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{packages.length}</p>
          <p className="text-xs text-gray-500">Packages</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">
            {allBatches.length}
          </p>
          <p className="text-xs text-gray-500">Total Batches</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Users className="w-5 h-5 text-orange-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
          <p className="text-xs text-gray-500">Total Bookings</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Calendar className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">
            {
              allBatches.filter((b) => new Date(b.startDate) > new Date())
                .length
            }
          </p>
          <p className="text-xs text-gray-500">Upcoming</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-100 p-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterPackage}
          onChange={(e) => setFilterPackage(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="all">All Packages</option>
          {packages.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search traveler..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Batch Cards */}
      <div className="space-y-3">
        {sortedBatches.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No batches found.</p>
          </div>
        )}
        {sortedBatches.map((batch) => {
          const pkg = getPackageForBatch(batch);
          const batchBookings = getBatchBookings(batch._id);
          const status = getBatchStatus(batch);
          const fillPercent =
            batch.totalSeats > 0
              ? Math.round(((batch.bookedSeats || 0) / batch.totalSeats) * 100)
              : 0;

          return (
            <div
              key={batch._id}
              onClick={() => setSelectedBatch(batch)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-teal-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-teal-700">
                      {fmtShort(batch.startDate).split(" ")[0]}
                    </span>
                    <span className="text-[10px] text-teal-600">
                      {fmtShort(batch.startDate).split(" ")[1]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {pkg?.title || "-"}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmt(batch.startDate)} {"\u2192"} {fmt(batch.endDate)}{" "}
                      {batch.label ? `\u00B7 ${batch.label}` : ""}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-xs text-gray-600 font-medium">
                        {fmtMoney(batch.adultPrice)}/pax
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${fillPercent >= 90 ? "bg-red-400" : fillPercent >= 50 ? "bg-amber-400" : "bg-green-400"}`}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {batch.bookedSeats || 0}/{batch.totalSeats}
                        </span>
                      </div>
                      <span className="text-xs text-teal-600 font-medium">
                        {batchBookings.length} bookings
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-300 -rotate-90" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
