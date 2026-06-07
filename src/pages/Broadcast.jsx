import { useState, useEffect } from "react";
import {
  Send,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Image,
  Clock,
  Tag,
  Percent,
  Star,
  Zap,
  Bell,
  Users,
  Package,
  Sparkles,
} from "lucide-react";
import {
  notificationsAdminAPI,
  adminPackagesAPI,
  adminBatchesAPI,
} from "../services/api";

// Quick emoji suggestions
const EMOJIS = [
  "🎉",
  "🌴",
  "✈️",
  "🎊",
  "💰",
  "🔥",
  "⭐",
  "❤️",
  "🏖️",
  "🎁",
  "🚀",
  "✨",
  "🌟",
  "💯",
  "👋",
  "🎯",
  "🆕",
  "⚡",
];

// Template suggestions
const TEMPLATES = [
  {
    title: "🎉 New Year Sale!",
    body: "Get 30% off on all trips this week. Book now!",
    icon: Percent,
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "🌴 Weekend Getaway",
    body: "Explore weekend packages starting from ₹2,999. Limited seats!",
    icon: Tag,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "⭐ Rate Your Trip",
    body: "Enjoyed your last trip? Rate it and help other travelers!",
    icon: Star,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "🎁 Referral Bonus",
    body: "Invite friends and earn ₹500 credit on their first booking!",
    icon: Users,
    color: "bg-green-50 text-green-600",
  },
  {
    title: "🔥 Flash Sale",
    body: "24-hour flash sale! Up to 50% off on selected packages.",
    icon: Zap,
    color: "bg-red-50 text-red-600",
  },
  {
    title: "📢 New Destination",
    body: "New packages added! Check out the latest destinations.",
    icon: Bell,
    color: "bg-teal-50 text-teal-600",
  },
];

// ── Smart Compose Component ───────────────────────────────────────────────────
function SmartCompose({ onGenerate }) {
  const [packages, setPackages] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [msgType, setMsgType] = useState("seats_left");
  const [loadingPkgs, setLoadingPkgs] = useState(false);

  useEffect(() => {
    setLoadingPkgs(true);
    adminPackagesAPI
      .getAll({ limit: 100 })
      .then((res) => setPackages(res.data?.packages || []))
      .catch(() => {})
      .finally(() => setLoadingPkgs(false));
  }, []);

  useEffect(() => {
    if (!selectedPkg) {
      setBatches([]);
      return;
    }
    adminBatchesAPI
      .getForPackage(selectedPkg)
      .then((res) => setBatches(res.data?.batches || []))
      .catch(() => setBatches([]));
  }, [selectedPkg]);

  const MSG_TYPES = [
    { id: "seats_left", label: "Low Seats Alert", emoji: "\u26A1" },
    { id: "new_batch", label: "New Batch Added", emoji: "\uD83C\uDF1F" },
    { id: "offer", label: "Special Offer", emoji: "\uD83C\uDF81" },
    { id: "reminder", label: "Booking Reminder", emoji: "\u23F0" },
    { id: "trending", label: "Trending Package", emoji: "\uD83D\uDD25" },
  ];

  const generate = () => {
    const pkg = packages.find((p) => p._id === selectedPkg);
    const batch = batches.find((b) => b._id === selectedBatch);
    if (!pkg) return;

    const price = batch?.adultPrice || pkg.price || 0;
    const seats = batch ? batch.totalSeats - (batch.bookedSeats || 0) : "";
    const location = pkg.location || "";
    const startDate = batch?.startDate
      ? new Date(batch.startDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        })
      : "";

    let title = "";
    let body = "";

    switch (msgType) {
      case "seats_left":
        title = `\u26A1 Only ${seats || "few"} seats left!`;
        body = `${pkg.title} (${location}) ${startDate ? `on ${startDate}` : ""} - Book now before it fills up! Starting \u20B9${price.toLocaleString("en-IN")}/person.`;
        break;
      case "new_batch":
        title = `\uD83C\uDF1F New dates available!`;
        body = `${pkg.title} ${startDate ? `- ${startDate} batch` : ""} is now open for booking! ${location} from \u20B9${price.toLocaleString("en-IN")}/person.`;
        break;
      case "offer":
        title = `\uD83C\uDF81 Special offer on ${pkg.title}!`;
        body = `Limited time deal! Book ${pkg.title} (${location}) starting \u20B9${price.toLocaleString("en-IN")}/person. Don't miss out!`;
        break;
      case "reminder":
        title = `\u23F0 Booking closing soon!`;
        body = `${pkg.title} (${location}) ${startDate ? `- ${startDate}` : ""} is filling up fast. Only ${seats || "few"} seats remaining. Book today!`;
        break;
      case "trending":
        title = `\uD83D\uDD25 ${pkg.title} is trending!`;
        body = `Everyone's booking ${pkg.title} (${location})! Join ${batch?.bookedSeats || "other"} travelers. From \u20B9${price.toLocaleString("en-IN")}/person.`;
        break;
    }

    onGenerate(title, body);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <p className="text-sm font-semibold text-indigo-800">Smart Compose</p>
        <span className="text-xs text-indigo-400">
          Auto-generate message from package data
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={selectedPkg}
          onChange={(e) => {
            setSelectedPkg(e.target.value);
            setSelectedBatch("");
          }}
          className="px-3 py-2.5 border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">Select Package</option>
          {packages.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title} - {p.location}
            </option>
          ))}
        </select>

        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          disabled={!selectedPkg || batches.length === 0}
          className="px-3 py-2.5 border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white disabled:opacity-50"
        >
          <option value="">Select Batch (optional)</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>
              {new Date(b.startDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              })}{" "}
              - {b.totalSeats - (b.bookedSeats || 0)} seats left
            </option>
          ))}
        </select>

        <select
          value={msgType}
          onChange={(e) => setMsgType(e.target.value)}
          className="px-3 py-2.5 border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          {MSG_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.emoji} {t.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={generate}
        disabled={!selectedPkg}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" /> Generate Message
      </button>
    </div>
  );
}

export default function Broadcast() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load broadcast history from admin notifications
  useEffect(() => {
    notificationsAdminAPI
      .getMy()
      .then((res) => {
        const sent = (res.data?.notifications || []).filter(
          (n) => n.type === "offer" || n.type === "general",
        );
        setHistory(sent.slice(0, 10));
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await notificationsAdminAPI.sendToAll(
        title.trim(),
        body.trim(),
        imageUrl.trim(),
      );
      setResult({
        success: true,
        message: `Sent to ${res.data?.sent || "all"} users`,
      });
      // Add to history
      setHistory((prev) => [
        {
          _id: Date.now(),
          title: title.trim(),
          body: body.trim(),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTitle("");
      setBody("");
      setImageUrl("");
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || "Failed to send",
      });
    } finally {
      setSending(false);
    }
  };

  const insertEmoji = (emoji) => {
    setTitle((prev) => prev + emoji);
  };

  const useTemplate = (tmpl) => {
    setTitle(tmpl.title);
    setBody(tmpl.body);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Broadcast Message
            </h1>
            <p className="text-sm text-gray-500">
              Send push notification + in-app notification to all users
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Clock className="w-4 h-4" />
          {showHistory ? "Compose" : "History"}
        </button>
      </div>

      {showHistory ? (
        /* ── Broadcast History ─────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              Recent Broadcasts
            </h2>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No broadcasts sent yet
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map((h) => (
                <div key={h._id} className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-800">{h.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{h.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(h.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Compose ──────────────────────────────────────────────── */
        <>
          {/* Quick Templates */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-teal-500" />
              <p className="text-sm font-semibold text-gray-700">
                Quick Templates
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {TEMPLATES.map((tmpl, i) => {
                const Icon = tmpl.icon;
                return (
                  <button
                    key={i}
                    onClick={() => useTemplate(tmpl)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 text-left transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg ${tmpl.color} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {tmpl.title}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {tmpl.body}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart Compose — auto-generate from packages/batches */}
          <SmartCompose
            onGenerate={(t, b) => {
              setTitle(t);
              setBody(b);
            }}
          />

          {/* Compose Form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            {/* Emoji bar */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Quick Emojis
              </p>
              <div className="flex flex-wrap gap-1">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🎉 New Year Sale!"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                maxLength={100}
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Message *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Get 30% off on all trips booked this week. Use code NEWYEAR30!"
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 resize-none"
                maxLength={300}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {body.length}/300
              </p>
            </div>

            {/* Image URL */}
            {/* Image Upload */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                <Image className="w-4 h-4 inline mr-1" />
                Image (optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                  <Image className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async () => {
                        try {
                          const { uploadAPI } = await import("../services/api");
                          const res = await uploadAPI.uploadBase64(
                            reader.result,
                            file.name,
                          );
                          setImageUrl(res.data?.url || "");
                        } catch {}
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {imageUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => setImageUrl("")}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Shows as big picture in push notification
              </p>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                  Push Notification Preview
                </p>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">TR</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {title || "Title"}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {body || "Message body"}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      now
                    </span>
                  </div>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      className="mt-2 w-full h-32 object-cover rounded-lg"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl border ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <p
                  className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}
                >
                  {result.message}
                </p>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Sending..." : "Send to All Users"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
