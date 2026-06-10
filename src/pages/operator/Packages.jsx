import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Package,
  Clock,
  MapPin,
  Upload,
  ImagePlus,
} from "lucide-react";
import { operatorPackagesAPI, operatorSettingsAPI } from "../../services/api";
import { COUNTRIES, INDIA_STATES } from "../../constants/locations";

const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING: "Pending Review",
  NEEDS_REVISION: "Needs Revision",
  APPROVED: "Published",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

const STATUS_COLORS = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  NEEDS_REVISION: "bg-orange-100 text-orange-700 border-orange-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  EXPIRED: "bg-gray-100 text-gray-700 border-gray-200",
};

const emptyForm = {
  title: "",
  tourType: "",
  destination: "",
  departureCity: "",
  durationDays: "",
  durationNights: "",
  location: "",
  country: "India",
  state: "",
  city: "",
  aboutThisTrip: "",
  about: "",
  price: "",
  priceLabel: "",
  badge: "Popular",
  duration: "",
  highlights: [""],
  itinerary: [
    { day: 1, title: "", points: [""], pickupPoint: "", isOutsideCity: false },
  ],
  inclusions: [""],
  exclusions: [""],
  addons: [{ name: "", price: "", details: [""] }],
  outsideCityCharge: "",
  videos: [""],
  hotelDetails: {
    hotelName: "",
    hotelCategory: "",
    roomType: "",
    mealPlan: "",
  },
  transportDetails: {
    flightIncluded: false,
    busIncluded: false,
    cabIncluded: false,
    pickupDrop: "",
    vehicleType: "",
  },
  pricing: {
    adultPrice: "",
    childPrice: "",
  },
  availability: {
    startDate: "",
    endDate: "",
    availableSeats: "",
    bookingDeadline: "",
  },
  policies: { cancellationPolicy: "", refundPolicy: "", terms: "" },
  offer: {
    couponCode: "",
    earlyBirdOffer: "",
    festivalOffer: "",
    groupDiscount: "",
  },
};

const inp =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all";

const TOUR_TYPES = ["Domestic", "International", "Adventure"];

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
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            value={v}
            onChange={(e) => update(i, e.target.value)}
            className={inp}
          />
          {values.length > 1 && (
            <button
              onClick={() => remove(i)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={add}
        className="text-sm text-teal-600 hover:underline font-medium"
      >
        + Add
      </button>
    </div>
  );
}

// ── Package Form Modal ────────────────────────────────────────────────────────
function PackageFormModal({ pkg, readOnly = false, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!pkg) return emptyForm;
    return {
      ...emptyForm,
      ...pkg,
      country: pkg.country || "India",
      state: pkg.state || "",
      city: pkg.city || "",
      destination: pkg.destination ?? "",
      departureCity: pkg.departureCity ?? "",
      durationDays: pkg.durationDays ?? "",
      durationNights: pkg.durationNights ?? "",
      aboutThisTrip: pkg.aboutThisTrip ?? pkg.fullDescription ?? "",
      outsideCityCharge: pkg.outsideCityCharge ?? "",
      videos: pkg.videos?.length ? pkg.videos : [""],
      highlights: pkg.highlights?.length ? pkg.highlights : [""],
      inclusions: pkg.inclusions?.length ? pkg.inclusions : [""],
      exclusions: pkg.exclusions?.length ? pkg.exclusions : [""],
      addons: pkg.addons?.length
        ? pkg.addons
        : [{ name: "", price: "", details: [""] }],
      itinerary: pkg.itinerary?.length
        ? pkg.itinerary.map((d) => ({
            ...d,
            pickupPoint: d.pickupPoint || "",
            isOutsideCity: d.isOutsideCity || false,
          }))
        : [
            {
              day: 1,
              title: "",
              points: [""],
              pickupPoint: "",
              isOutsideCity: false,
            },
          ],
      hotelDetails: { ...emptyForm.hotelDetails, ...(pkg.hotelDetails || {}) },
      transportDetails: {
        ...emptyForm.transportDetails,
        ...(pkg.transportDetails || {}),
      },
      pricing: { ...emptyForm.pricing, ...(pkg.pricing || {}) },
      availability: { ...emptyForm.availability, ...(pkg.availability || {}) },
      policies: { ...emptyForm.policies, ...(pkg.policies || {}) },
      offer: { ...emptyForm.offer, ...(pkg.offer || {}) },
    };
  });

  // File objects for new uploads — slot 0 is automatically the cover image
  const [imageFiles, setImageFiles] = useState([null, null, null, null]);

  // Preview URLs (existing server URLs or local object URLs) — slot 0 = cover
  const [imagePreviews, setImagePreviews] = useState(() => {
    // Merge existing cover + gallery into one flat array of up to 4
    const existing = [];
    if (pkg?.image_url) existing.push(pkg.image_url);
    if (pkg?.images?.length) existing.push(...pkg.images);
    return [...existing, "", "", "", ""].slice(0, 4);
  });

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => {
    setForm((f) => {
      const updated = { ...f, [key]: val };

      // Auto-sync itinerary days when durationDays changes
      if (key === "durationDays") {
        const days = Math.max(0, Number(val) || 0);
        const current = Array.isArray(updated.itinerary)
          ? updated.itinerary
          : [];
        if (days > current.length) {
          // Add missing days
          const extra = Array.from(
            { length: days - current.length },
            (_, i) => ({
              day: current.length + i + 1,
              title: "",
              points: [""],
              pickupPoint: "",
              isOutsideCity: false,
            }),
          );
          updated.itinerary = [...current, ...extra];
        } else if (days < current.length && days > 0) {
          // Trim excess days
          updated.itinerary = current.slice(0, days);
        }
      }
      return updated;
    });
  };

  // Fetch default policies for NEW packages (not when editing)
  useEffect(() => {
    if (pkg) return; // only for new packages
    const fetchDefaults = async () => {
      try {
        const res = await operatorSettingsAPI.getDefaults();
        const d = res.data || {};
        setForm((f) => ({
          ...f,
          policies: {
            ...f.policies,
            cancellationPolicy:
              f.policies.cancellationPolicy ||
              d.default_cancellation_policy ||
              "",
            refundPolicy:
              f.policies.refundPolicy || d.default_refund_policy || "",
            terms: f.policies.terms || d.default_terms || "",
          },
        }));
      } catch {
        /* silently fail — operator can still type manually */
      }
    };
    fetchDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = (file, idx) => {
    if (!file) return;
    const files = [...imageFiles];
    files[idx] = file;
    setImageFiles(files);
    const previews = [...imagePreviews];
    previews[idx] = URL.createObjectURL(file);
    setImagePreviews(previews);
  };

  const removeImage = (idx) => {
    const files = [...imageFiles];
    files[idx] = null;
    setImageFiles(files);
    const previews = [...imagePreviews];
    previews[idx] = "";
    setImagePreviews(previews);
  };

  const validateSubmit = () => {
    if (!form.title?.trim()) return "Package title is required.";
    const destination = (form.destination || form.location || "").trim();
    if (!destination) return "Destination is required.";
    const price =
      Number(form.pricing?.adultPrice || 0) || Number(form.price || 0);
    if (!price || Number.isNaN(price) || price <= 0)
      return "Adult price (or base price) is required.";
    const itineraryOk =
      Array.isArray(form.itinerary) &&
      form.itinerary.some((d) => d?.title?.trim());
    if (!itineraryOk) return "Add at least 1 itinerary day with a title.";
    if (!imageFiles[0] && !imagePreviews[0])
      return "At least 1 image is required to submit.";
    return "";
  };

  const handleSave = async (submissionMode) => {
    const mode = (submissionMode || "SUBMIT").toString().toUpperCase();
    if (mode === "SUBMIT") {
      const msg = validateSubmit();
      if (msg) {
        setError(msg);
        return;
      }
    } else if (!form.title?.trim()) {
      setError("Add at least a title to save as draft.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("submissionMode", mode);

      const resolvedDestination = (
        form.destination ||
        form.location ||
        ""
      ).trim();

      // Auto-build a display location string from structured fields
      const locationParts = [form.city, form.state, form.country].filter(
        Boolean,
      );
      const resolvedLocation =
        resolvedDestination ||
        (locationParts.length ? locationParts.join(", ") : "");

      const resolvedPrice =
        Number(form.pricing?.adultPrice || 0) || Number(form.price || 0) || 0;

      const days = Number(form.durationDays || 0);
      const nights = Number(form.durationNights || 0);
      const resolvedDuration =
        (form.duration || "").trim() ||
        (days || nights ? `${days || 0} Days / ${nights || 0} Nights` : "");

      const scalars = [
        "title",
        "tourType",
        "departureCity",
        "durationDays",
        "durationNights",
        "aboutThisTrip",
        "about",
        "priceLabel",
        "badge",
        "country",
        "state",
        "city",
      ];
      scalars.forEach((k) => fd.append(k, form[k] ?? ""));
      fd.append("duration", resolvedDuration);
      fd.append(
        "outsideCityCharge",
        String(Number(form.outsideCityCharge) || 0),
      );

      fd.append("destination", resolvedLocation);
      fd.append("location", resolvedLocation);
      fd.append("price", String(resolvedPrice));

      const cleanStrList = (arr) =>
        (Array.isArray(arr) ? arr : [])
          .map((s) => String(s || "").trim())
          .filter(Boolean);

      const arrays = {
        highlights: cleanStrList(form.highlights),
        inclusions: cleanStrList(form.inclusions),
        exclusions: cleanStrList(form.exclusions),
        videos: cleanStrList(form.videos),
        itinerary: (Array.isArray(form.itinerary) ? form.itinerary : [])
          .map((d, idx) => ({
            day: Number(d.day || idx + 1),
            title: String(d.title || "").trim(),
            points: cleanStrList(d.points || []),
            pickupPoint: String(d.pickupPoint || "").trim(),
            isOutsideCity: Boolean(d.isOutsideCity),
          }))
          .filter((d) => d.title),
        addons: (Array.isArray(form.addons) ? form.addons : [])
          .map((a) => ({
            name: String(a.name || "").trim(),
            price: Number(a.price || 0),
            details: cleanStrList(a.details || []),
          }))
          .filter((a) => a.name),
      };

      Object.entries(arrays).forEach(([k, v]) =>
        fd.append(k, JSON.stringify(v)),
      );

      const toNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      const objects = {
        hotelDetails: {
          hotelName: form.hotelDetails?.hotelName || "",
          hotelCategory: form.hotelDetails?.hotelCategory || "",
          roomType: form.hotelDetails?.roomType || "",
          mealPlan: form.hotelDetails?.mealPlan || "",
        },
        transportDetails: {
          flightIncluded: Boolean(form.transportDetails?.flightIncluded),
          busIncluded: Boolean(form.transportDetails?.busIncluded),
          cabIncluded: Boolean(form.transportDetails?.cabIncluded),
          pickupDrop: form.transportDetails?.pickupDrop || "",
          vehicleType: form.transportDetails?.vehicleType || "",
        },
        pricing: {
          adultPrice: toNum(form.pricing?.adultPrice),
          childPrice: toNum(form.pricing?.childPrice),
        },
        availability: {
          startDate: form.availability?.startDate || "",
          endDate: form.availability?.endDate || "",
          availableSeats: toNum(form.availability?.availableSeats),
          bookingDeadline: form.availability?.bookingDeadline || "",
        },
        policies: {
          cancellationPolicy: form.policies?.cancellationPolicy || "",
          refundPolicy: form.policies?.refundPolicy || "",
          terms: form.policies?.terms || "",
        },
        offer: {
          couponCode: form.offer?.couponCode || "",
          earlyBirdOffer: form.offer?.earlyBirdOffer || "",
          festivalOffer: form.offer?.festivalOffer || "",
          groupDiscount: form.offer?.groupDiscount || "",
        },
      };

      Object.entries(objects).forEach(([k, v]) =>
        fd.append(k, JSON.stringify(v)),
      );

      // Slot 0 = cover image (image_url), slots 1-3 = gallery (images)
      imageFiles.forEach((file, i) => {
        if (file) {
          fd.append(i === 0 ? "image_url" : "images", file);
        } else if (imagePreviews[i]) {
          fd.append(
            i === 0 ? "existing_image_url" : "existing_images",
            imagePreviews[i],
          );
        }
      });

      let res;
      if (pkg) {
        res = await operatorPackagesAPI.update(pkg._id, fd);
      } else {
        res = await operatorPackagesAPI.create(fd);
      }
      onSaved(res.data.package);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateItinerary = (i, key, val) => {
    const a = [...form.itinerary];
    a[i] = { ...a[i], [key]: val };
    set("itinerary", a);
  };
  const updateItPoint = (di, pi, val) => {
    const a = [...form.itinerary];
    a[di].points[pi] = val;
    set("itinerary", a);
  };
  const addItPoint = (di) => {
    const a = [...form.itinerary];
    a[di].points = [...a[di].points, ""];
    set("itinerary", a);
  };
  const removeItPoint = (di, pi) => {
    const a = [...form.itinerary];
    a[di].points = a[di].points.filter((_, i) => i !== pi);
    set("itinerary", a);
  };
  const addDay = () =>
    set("itinerary", [
      ...form.itinerary,
      {
        day: form.itinerary.length + 1,
        title: "",
        points: [""],
        pickupPoint: "",
        isOutsideCity: false,
      },
    ]);
  const removeDay = (i) =>
    set(
      "itinerary",
      form.itinerary.filter((_, idx) => idx !== i),
    );

  const steps = [
    "Basic Information",
    "Upload Images",
    "Add Itinerary",
    "Pricing & Logistics",
    "Policies & Inclusions",
    "Preview Package",
    "Submit for Approval",
  ];

  const setNested = (path, val) => {
    const [root, key] = path.split(".");
    setForm((prev) => ({
      ...prev,
      [root]: { ...(prev[root] || {}), [key]: val },
    }));
  };

  const goNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Package Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Goa Beach Holiday"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tour Type
              </label>
              <select
                value={form.tourType}
                onChange={(e) => set("tourType", e.target.value)}
                className={inp}
              >
                <option value="">Select</option>
                {TOUR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Destination *
              </label>
              <input
                value={form.destination || form.location}
                onChange={(e) => {
                  set("destination", e.target.value);
                  set("location", e.target.value);
                }}
                placeholder="e.g. Goa, India"
                className={inp}
              />
            </div>

            {/* ── Location: Country / State / City ─────────────────────── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Country *
              </label>
              <select
                value={form.country}
                onChange={(e) => {
                  set("country", e.target.value);
                  // Reset state when country changes to non-India
                  if (e.target.value !== "India") set("state", "");
                }}
                className={inp}
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* State dropdown — only shown for India */}
            {form.country === "India" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  State *
                </label>
                <select
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  className={inp}
                >
                  <option value="">Select state</option>
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                City
              </label>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder={
                  form.country === "India"
                    ? "e.g. Panaji, Calangute"
                    : "e.g. Dubai, Bangkok"
                }
                className={inp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Departure City
              </label>
              <input
                value={form.departureCity}
                onChange={(e) => set("departureCity", e.target.value)}
                placeholder="e.g. Mumbai"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration (Days)
              </label>
              <input
                type="number"
                value={form.durationDays}
                onChange={(e) => set("durationDays", e.target.value)}
                placeholder="4"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration (Nights)
              </label>
              <input
                type="number"
                value={form.durationNights}
                onChange={(e) => set("durationNights", e.target.value)}
                placeholder="3"
                className={inp}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                About This Trip
              </label>
              <textarea
                value={form.aboutThisTrip}
                onChange={(e) => set("aboutThisTrip", e.target.value)}
                rows={4}
                placeholder="Detailed overview of the package"
                className={inp + " resize-none"}
              />
            </div>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Upload up to 4 photos. The{" "}
            <span className="font-semibold text-teal-600">first photo</span>{" "}
            will be used as the cover image.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx}>
                {imagePreviews[idx] ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={imagePreviews[idx]}
                      alt={`photo ${idx + 1}`}
                      className="w-full h-36 object-cover"
                    />
                    {/* Cover badge on first slot */}
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500 text-white shadow">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                    <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 font-medium">
                      {idx === 0 ? "Photo 1 (Cover)" : `Photo ${idx + 1}`}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      max 5 MB
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleImageChange(e.target.files?.[0], idx)
                      }
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
          <TagListEditor
            label="Video URLs (optional)"
            values={form.videos || [""]}
            onChange={(v) => set("videos", v)}
          />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          {/* Outside City Charge — applies to all outside-city addon days */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <label className="block text-sm font-semibold text-amber-800 mb-1.5">
              Outside City Surcharge (₹ per person per day)
            </label>
            <p className="text-xs text-amber-700 mb-2">
              Extra charge when photographer/reel maker travels outside city.
              This goes to your earnings.
            </p>
            <input
              type="number"
              min="0"
              value={form.outsideCityCharge}
              onChange={(e) => set("outsideCityCharge", e.target.value)}
              placeholder="e.g. 500"
              className={inp}
            />
          </div>

          {form.itinerary.map((day, di) => (
            <div key={di} className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {day.day || di + 1}
                  </span>
                </div>
                <input
                  value={day.title}
                  onChange={(e) => updateItinerary(di, "title", e.target.value)}
                  placeholder={`Day ${di + 1} title`}
                  className={inp + " flex-1"}
                />
                {form.itinerary.length > 1 && (
                  <button
                    onClick={() => removeDay(di)}
                    className="p-1.5 text-red-400 hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Pickup Point + Outside City Toggle */}
              <div className="pl-11 space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    value={day.pickupPoint || ""}
                    onChange={(e) =>
                      updateItinerary(di, "pickupPoint", e.target.value)
                    }
                    placeholder="Pickup Point (e.g. Hotel Lobby, Bus Stand)"
                    className={inp + " flex-1"}
                  />
                  <label
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs cursor-pointer whitespace-nowrap transition-colors ${
                      day.isOutsideCity
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-gray-200 hover:border-amber-300 text-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(day.isOutsideCity)}
                      onChange={(e) =>
                        updateItinerary(di, "isOutsideCity", e.target.checked)
                      }
                      className="accent-amber-600"
                    />
                    Outside City
                  </label>
                </div>
              </div>

              <div className="pl-11 space-y-2">
                {day.points.map((pt, pi) => (
                  <div key={pi} className="flex gap-2">
                    <input
                      value={pt}
                      onChange={(e) => updateItPoint(di, pi, e.target.value)}
                      placeholder="Activity or point"
                      className={inp + " flex-1"}
                    />
                    {day.points.length > 1 && (
                      <button
                        onClick={() => removeItPoint(di, pi)}
                        className="p-1.5 text-red-400 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addItPoint(di)}
                  className="text-sm text-teal-600 hover:underline font-medium"
                >
                  + Add point
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addDay}
            className="flex items-center gap-2 text-sm text-teal-600 hover:underline font-medium"
          >
            <Plus className="w-4 h-4" /> Add Day
          </button>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Pricing</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adult Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.pricing?.adultPrice}
                  onChange={(e) =>
                    setNested("pricing.adultPrice", e.target.value)
                  }
                  placeholder="8999"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Child Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.pricing?.childPrice}
                  onChange={(e) =>
                    setNested("pricing.childPrice", e.target.value)
                  }
                  placeholder="5999"
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Price Label
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.priceLabel}
                  onChange={(e) =>
                    set("priceLabel", e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="e.g. 7999"
                  className={inp}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Hotel Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hotel Name
                </label>
                <input
                  value={form.hotelDetails?.hotelName}
                  onChange={(e) =>
                    setNested("hotelDetails.hotelName", e.target.value)
                  }
                  placeholder="Hotel Taj Resort"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hotel Category
                </label>
                <input
                  value={form.hotelDetails?.hotelCategory}
                  onChange={(e) =>
                    setNested("hotelDetails.hotelCategory", e.target.value)
                  }
                  placeholder="3 Star / 4 Star"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Room Type
                </label>
                <input
                  value={form.hotelDetails?.roomType}
                  onChange={(e) =>
                    setNested("hotelDetails.roomType", e.target.value)
                  }
                  placeholder="Deluxe"
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Meal Plan
                </label>
                <input
                  value={form.hotelDetails?.mealPlan}
                  onChange={(e) =>
                    setNested("hotelDetails.mealPlan", e.target.value)
                  }
                  placeholder="Breakfast only / MAP / AP"
                  className={inp}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Transport Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              {[
                ["flightIncluded", "Flight Included?"],
                ["busIncluded", "Bus Included?"],
                ["cabIncluded", "Cab Included?"],
              ].map(([k, label]) => (
                <label
                  key={k}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                    form.transportDetails?.[k]
                      ? "border-teal-300 bg-teal-50 text-teal-700"
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.transportDetails?.[k])}
                    onChange={(e) =>
                      setNested(`transportDetails.${k}`, e.target.checked)
                    }
                    className="accent-teal-600"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Pickup & Drop
                </label>
                <input
                  value={form.transportDetails?.pickupDrop}
                  onChange={(e) =>
                    setNested("transportDetails.pickupDrop", e.target.value)
                  }
                  placeholder="Airport pickup & hotel drop"
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vehicle Type
                </label>
                <input
                  value={form.transportDetails?.vehicleType}
                  onChange={(e) =>
                    setNested("transportDetails.vehicleType", e.target.value)
                  }
                  placeholder="Innova / Tempo Traveller"
                  className={inp}
                />
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-teal-800">
              💡 Trip Batches
            </p>
            <p className="text-xs text-teal-700 mt-1">
              After this package is approved by admin, you can add scheduled
              departures (batches) with specific dates, pricing, and seat counts
              from the <strong>Manage Batches</strong> page. No re-approval
              needed for new batches.
            </p>
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-5">
          <TagListEditor
            label="Highlights"
            values={form.highlights}
            onChange={(v) => set("highlights", v)}
          />
          <TagListEditor
            label="Inclusions"
            values={form.inclusions}
            onChange={(v) => set("inclusions", v)}
          />
          <TagListEditor
            label="Exclusions"
            values={form.exclusions}
            onChange={(v) => set("exclusions", v)}
          />
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Policies</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cancellation Policy
                </label>
                <textarea
                  value={form.policies?.cancellationPolicy}
                  onChange={(e) =>
                    setNested("policies.cancellationPolicy", e.target.value)
                  }
                  rows={3}
                  className={inp + " resize-none"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Refund Policy
                </label>
                <textarea
                  value={form.policies?.refundPolicy}
                  onChange={(e) =>
                    setNested("policies.refundPolicy", e.target.value)
                  }
                  rows={3}
                  className={inp + " resize-none"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Terms & Conditions
                </label>
                <textarea
                  value={form.policies?.terms}
                  onChange={(e) => setNested("policies.terms", e.target.value)}
                  rows={3}
                  className={inp + " resize-none"}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Offer (optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Coupon Code
                </label>
                <input
                  value={form.offer?.couponCode}
                  onChange={(e) =>
                    setNested("offer.couponCode", e.target.value)
                  }
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Early Bird Offer
                </label>
                <input
                  value={form.offer?.earlyBirdOffer}
                  onChange={(e) =>
                    setNested("offer.earlyBirdOffer", e.target.value)
                  }
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Festival Offer
                </label>
                <input
                  value={form.offer?.festivalOffer}
                  onChange={(e) =>
                    setNested("offer.festivalOffer", e.target.value)
                  }
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Group Discount
                </label>
                <input
                  value={form.offer?.groupDiscount}
                  onChange={(e) =>
                    setNested("offer.groupDiscount", e.target.value)
                  }
                  className={inp}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 5) {
      const destination = (form.destination || form.location || "").trim();
      const price =
        Number(form.pricing?.discountPrice || 0) ||
        Number(form.pricing?.adultPrice || 0) ||
        Number(form.price || 0);
      const submitErr = validateSubmit();
      return (
        <div className="space-y-4">
          {imagePreviews[0] && (
            <img
              src={imagePreviews[0]}
              alt="cover"
              className="w-full h-48 object-cover rounded-xl"
            />
          )}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {form.title || "—"}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {destination || "—"}{" "}
                  {form.durationDays || form.durationNights || form.duration
                    ? `· ${form.durationDays || ""}${form.durationDays ? "D" : ""}${form.durationNights ? `/${form.durationNights}N` : ""} ${form.duration || ""}`
                    : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {price ? `₹${Number(price).toLocaleString()}` : "—"}
                </p>
                <p className="text-xs text-gray-400">per person</p>
              </div>
            </div>
            {submitErr ? (
              <div className="mt-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
                {submitErr}
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-xl border border-green-200 bg-green-50 text-sm text-green-800">
                Looks good. Continue to submit for admin approval.
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          Submit will send this package for admin review. If admin requests
          changes, you can edit and submit again.
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
          You can also save a draft and complete the remaining steps later.
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {readOnly
              ? "View Package"
              : pkg
                ? "Edit Package"
                : "Create New Package"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                Step {step + 1} of {steps.length}: {steps[step]}
              </p>
              <div className="mt-2 w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all"
                  style={{
                    width: `${Math.round(((step + 1) / steps.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleSave("DRAFT")}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Save Draft
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* readOnly wrapper — disables all form interactions */}
          <div
            className={
              readOnly ? "pointer-events-none opacity-80 select-none" : ""
            }
          >
            {renderStep()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={loading || step === 0}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={loading}
                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Next
              </button>
            ) : !readOnly ? (
              <button
                type="button"
                onClick={() => handleSave("SUBMIT")}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Submit for Approval
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OperatorPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formPkg, setFormPkg] = useState(undefined); // undefined = closed, null = new, obj = edit
  const [viewPkg, setViewPkg] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await operatorPackagesAPI.getMine();
      setPackages(res.data.packages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSaved = (pkg) => {
    setPackages((prev) => {
      const exists = prev.find((p) => p._id === pkg._id);
      return exists
        ? prev.map((p) => (p._id === pkg._id ? pkg : p))
        : [pkg, ...prev];
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this package?")) return;
    try {
      await operatorPackagesAPI.delete(id);
      setPackages((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Packages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create packages and submit them for admin review
          </p>
        </div>
        <button
          onClick={() => setFormPkg(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Package
        </button>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-sm text-blue-700">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">How it works</p>
          <p className="text-blue-600 mt-0.5">
            Submit your package for review. The admin will approve it, request
            changes, or reject it. Approved packages are published to the
            platform with the category assigned by admin.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <Package className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No packages yet</p>
          <p className="text-xs mt-1">
            Click "New Package" to create your first one
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-36 bg-gray-100">
                {pkg.image_url ? (
                  <img
                    src={pkg.image_url}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[pkg.status] || "bg-gray-100 text-gray-700"}`}
                  >
                    {STATUS_LABELS[pkg.status] || pkg.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">
                  {pkg.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[pkg.city, pkg.state, pkg.country]
                      .filter(Boolean)
                      .join(", ") || pkg.location}
                  </span>
                  {pkg.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {pkg.duration}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-teal-600 mt-2">
                  ₹{Number(pkg.price).toLocaleString()}
                </p>

                {/* Admin note */}
                {pkg.adminNotes && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg border text-xs ${
                      pkg.status === "NEEDS_REVISION"
                        ? "bg-orange-50 border-orange-200 text-orange-700"
                        : pkg.status === "REJECTED"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-green-50 border-green-200 text-green-700"
                    }`}
                  >
                    <p className="font-semibold mb-0.5 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Admin Note
                    </p>
                    <p>{pkg.adminNotes}</p>
                  </div>
                )}

                {/* Approved category */}
                {pkg.status === "APPROVED" && pkg.approvedCategory && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Published in:{" "}
                    <span className="font-semibold">
                      {pkg.approvedCategory}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {[
                    "DRAFT",
                    "PENDING",
                    "NEEDS_REVISION",
                    "REJECTED",
                    "APPROVED",
                  ].includes(pkg.status) && (
                    <button
                      onClick={() => {
                        setFormPkg(pkg);
                        setViewOnly(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {pkg.status === "NEEDS_REVISION"
                        ? "Fix & Resubmit"
                        : pkg.status === "DRAFT"
                          ? "Continue"
                          : pkg.status === "APPROVED"
                            ? "Edit (re-review)"
                            : "Edit"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setFormPkg(pkg);
                      setViewOnly(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  {pkg.status !== "APPROVED" && (
                    <button
                      onClick={() => handleDelete(pkg._id)}
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

      {/* Form modal */}
      {formPkg !== undefined && (
        <PackageFormModal
          pkg={formPkg}
          readOnly={viewOnly}
          onClose={() => {
            setFormPkg(undefined);
            setViewOnly(false);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
