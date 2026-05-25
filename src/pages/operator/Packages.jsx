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
  Image,
} from "lucide-react";
import { operatorPackagesAPI } from "../../services/api";

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
  subtitle: "",
  packageCode: "",
  tourType: "",
  destination: "",
  departureCity: "",
  durationDays: "",
  durationNights: "",
  location: "",
  categories: [],
  description: "",
  fullDescription: "",
  whyChoose: "",
  about: "",
  price: "",
  priceLabel: "",
  badge: "Popular",
  duration: "",
  highlights: [""],
  itinerary: [{ day: 1, title: "", points: [""] }],
  inclusions: [""],
  exclusions: [""],
  addons: [{ name: "", price: "", details: [""] }],
  videos: [""],
  hotelDetails: { hotelName: "", hotelCategory: "", roomType: "", mealPlan: "" },
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
    extraPersonPrice: "",
    discountPrice: "",
    gstPercent: "",
    convenienceFee: "",
  },
  availability: {
    startDate: "",
    endDate: "",
    availableSeats: "",
    bookingDeadline: "",
  },
  locationDetails: {
    destinationName: "",
    googleMapUrl: "",
    pickupPoint: "",
    meetingPoint: "",
  },
  policies: { cancellationPolicy: "", refundPolicy: "", terms: "" },
  offer: { couponCode: "", earlyBirdOffer: "", festivalOffer: "", groupDiscount: "" },
};

// Previews are kept separately (data URLs for display, File objects for upload)
const emptyPreviews = {
  image_url: "",      // data URL or existing URL
  images: ["", "", "", ""], // data URLs or existing URLs
};
const emptyFiles = {
  image_url: null,    // File | null
  images: [null, null, null, null], // File | null
};

const inp =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all";

const PACKAGE_CATEGORIES = [
  "Domestic Tour",
  "International Tour",
  "Honeymoon",
  "Adventure",
  "Family Tour",
  "Group Tour",
  "Corporate Tour",
  "Luxury Tour",
  "Budget Tour",
];

const TOUR_TYPES = ["Domestic", "International", "Adventure"];

function TagListEditor({ label, values, onChange }) {
  const update = (i, val) => { const a = [...values]; a[i] = val; onChange(a); };
  const add = () => onChange([...values, ""]);
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input value={v} onChange={(e) => update(i, e.target.value)} className={inp} />
          {values.length > 1 && (
            <button onClick={() => remove(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button onClick={add} className="text-sm text-teal-600 hover:underline font-medium">+ Add</button>
    </div>
  );
}

// ── Package Form Modal ────────────────────────────────────────────────────────
function PackageFormModal({ pkg, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!pkg) return emptyForm;
    return {
      ...emptyForm,
      ...pkg,
      subtitle: pkg.subtitle ?? pkg.subTitle ?? "",
      packageCode: pkg.packageCode ?? pkg.code ?? "",
      destination: pkg.destination ?? "",
      departureCity: pkg.departureCity ?? "",
      durationDays: pkg.durationDays ?? "",
      durationNights: pkg.durationNights ?? "",
      categories: Array.isArray(pkg.categories) ? pkg.categories : [],
      fullDescription: pkg.fullDescription ?? "",
      whyChoose: pkg.whyChoose ?? "",
      videos: pkg.videos?.length ? pkg.videos : [""],
      highlights: pkg.highlights?.length ? pkg.highlights : [""],
      inclusions: pkg.inclusions?.length ? pkg.inclusions : [""],
      exclusions: pkg.exclusions?.length ? pkg.exclusions : [""],
      addons: pkg.addons?.length ? pkg.addons : [{ name: "", price: "", details: [""] }],
      itinerary: pkg.itinerary?.length ? pkg.itinerary : [{ day: 1, title: "", points: [""] }],
      hotelDetails: { ...emptyForm.hotelDetails, ...(pkg.hotelDetails || {}) },
      transportDetails: { ...emptyForm.transportDetails, ...(pkg.transportDetails || {}) },
      pricing: { ...emptyForm.pricing, ...(pkg.pricing || {}) },
      availability: { ...emptyForm.availability, ...(pkg.availability || {}) },
      locationDetails: { ...emptyForm.locationDetails, ...(pkg.locationDetails || {}) },
      policies: { ...emptyForm.policies, ...(pkg.policies || {}) },
      offer: { ...emptyForm.offer, ...(pkg.offer || {}) },
    };
  });

  // File objects for new uploads
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([null, null, null, null]);

  // Preview URLs (existing server URLs or local object URLs)
  const [coverPreview, setCoverPreview] = useState(pkg?.image_url || "");
  const [galleryPreviews, setGalleryPreviews] = useState(
    pkg?.images?.length
      ? [...pkg.images, "", "", "", ""].slice(0, 4)
      : ["", "", "", ""]
  );

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleCoverChange = (file) => {
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleGalleryChange = (file, idx) => {
    if (!file) return;
    const files = [...galleryFiles]; files[idx] = file; setGalleryFiles(files);
    const previews = [...galleryPreviews]; previews[idx] = URL.createObjectURL(file); setGalleryPreviews(previews);
  };

  const removeCover = () => { setCoverFile(null); setCoverPreview(""); };
  const removeGallery = (idx) => {
    const files = [...galleryFiles]; files[idx] = null; setGalleryFiles(files);
    const previews = [...galleryPreviews]; previews[idx] = ""; setGalleryPreviews(previews);
  };

  const validateSubmit = () => {
    if (!form.title?.trim()) return "Package title is required.";
    const destination = (form.destination || form.location || "").trim();
    if (!destination) return "Destination is required.";
    const price =
      Number(form.pricing?.discountPrice || 0) ||
      Number(form.pricing?.adultPrice || 0) ||
      Number(form.price || 0);
    if (!price || Number.isNaN(price) || price <= 0) return "Adult price (or base price) is required.";
    const itineraryOk = Array.isArray(form.itinerary) && form.itinerary.some((d) => d?.title?.trim());
    if (!itineraryOk) return "Add at least 1 itinerary day with a title.";
    if (!coverFile && !coverPreview) return "Cover image is required to submit.";
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

      const resolvedDestination = (form.destination || form.location || "").trim();
      const resolvedLocation = resolvedDestination || form.location || "";

      const resolvedPrice =
        Number(form.pricing?.discountPrice || 0) ||
        Number(form.pricing?.adultPrice || 0) ||
        Number(form.price || 0) ||
        0;

      const days = Number(form.durationDays || 0);
      const nights = Number(form.durationNights || 0);
      const resolvedDuration =
        (form.duration || "").trim() ||
        (days || nights ? `${days || 0} Days / ${nights || 0} Nights` : "");

      const scalars = [
        "title",
        "subtitle",
        "packageCode",
        "tourType",
        "departureCity",
        "durationDays",
        "durationNights",
        "description",
        "fullDescription",
        "whyChoose",
        "about",
        "priceLabel",
        "badge",
      ];
      scalars.forEach((k) => fd.append(k, form[k] ?? ""));
      fd.append("duration", resolvedDuration);

      fd.append("destination", resolvedDestination);
      fd.append("location", resolvedLocation);
      fd.append("price", String(resolvedPrice));

      const cleanStrList = (arr) =>
        (Array.isArray(arr) ? arr : []).map((s) => String(s || "").trim()).filter(Boolean);

      const arrays = {
        highlights: cleanStrList(form.highlights),
        inclusions: cleanStrList(form.inclusions),
        exclusions: cleanStrList(form.exclusions),
        categories: cleanStrList(form.categories),
        videos: cleanStrList(form.videos),
        itinerary: (Array.isArray(form.itinerary) ? form.itinerary : [])
          .map((d, idx) => ({
            day: Number(d.day || idx + 1),
            title: String(d.title || "").trim(),
            points: cleanStrList(d.points || []),
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

      Object.entries(arrays).forEach(([k, v]) => fd.append(k, JSON.stringify(v)));

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
          extraPersonPrice: toNum(form.pricing?.extraPersonPrice),
          discountPrice: toNum(form.pricing?.discountPrice),
          gstPercent: toNum(form.pricing?.gstPercent),
          convenienceFee: toNum(form.pricing?.convenienceFee),
        },
        availability: {
          startDate: form.availability?.startDate || "",
          endDate: form.availability?.endDate || "",
          availableSeats: toNum(form.availability?.availableSeats),
          bookingDeadline: form.availability?.bookingDeadline || "",
        },
        locationDetails: {
          destinationName: form.locationDetails?.destinationName || "",
          googleMapUrl: form.locationDetails?.googleMapUrl || "",
          pickupPoint: form.locationDetails?.pickupPoint || "",
          meetingPoint: form.locationDetails?.meetingPoint || "",
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

      Object.entries(objects).forEach(([k, v]) => fd.append(k, JSON.stringify(v)));

      if (coverFile) {
        fd.append("image_url", coverFile);
      } else if (coverPreview) {
        fd.append("existing_image_url", coverPreview);
      }

      galleryFiles.forEach((file, i) => {
        if (file) {
          fd.append("images", file);
        } else if (galleryPreviews[i]) {
          fd.append("existing_images", galleryPreviews[i]);
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
    const a = [...form.itinerary]; a[i] = { ...a[i], [key]: val }; set("itinerary", a);
  };
  const updateItPoint = (di, pi, val) => {
    const a = [...form.itinerary]; a[di].points[pi] = val; set("itinerary", a);
  };
  const addItPoint = (di) => {
    const a = [...form.itinerary]; a[di].points = [...a[di].points, ""]; set("itinerary", a);
  };
  const removeItPoint = (di, pi) => {
    const a = [...form.itinerary]; a[di].points = a[di].points.filter((_, i) => i !== pi); set("itinerary", a);
  };
  const addDay = () => set("itinerary", [...form.itinerary, { day: form.itinerary.length + 1, title: "", points: [""] }]);
  const removeDay = (i) => set("itinerary", form.itinerary.filter((_, idx) => idx !== i));

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
    setForm((prev) => ({ ...prev, [root]: { ...(prev[root] || {}), [key]: val } }));
  };

  const toggleCategory = (c) => {
    setForm((prev) => {
      const cur = Array.isArray(prev.categories) ? prev.categories : [];
      const next = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
      return { ...prev, categories: next };
    });
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
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Package Subtitle
              </label>
              <input
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="e.g. 4 Days / 3 Nights"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Package Code/ID
              </label>
              <input
                value={form.packageCode}
                onChange={(e) => set("packageCode", e.target.value)}
                placeholder="e.g. GOA-4D3N-001"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PACKAGE_CATEGORIES.map((c) => (
                  <label
                    key={c}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                      (form.categories || []).includes(c)
                        ? "border-teal-300 bg-teal-50 text-teal-700"
                        : "border-gray-200 hover:border-teal-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={(form.categories || []).includes(c)}
                      onChange={() => toggleCategory(c)}
                      className="accent-teal-600"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Short Description
              </label>
              <input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="One-line summary shown in listings"
                className={inp}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Description
              </label>
              <textarea
                value={form.fullDescription}
                onChange={(e) => set("fullDescription", e.target.value)}
                rows={4}
                placeholder="Detailed overview of the package"
                className={inp + " resize-none"}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Why choose this package
              </label>
              <textarea
                value={form.whyChoose}
                onChange={(e) => set("whyChoose", e.target.value)}
                rows={3}
                placeholder="Key selling points and differentiators"
                className={inp + " resize-none"}
              />
            </div>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cover Image <span className="text-gray-400 font-normal">(max 5 MB)</span>
            </label>
            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={coverPreview} alt="cover" className="w-full h-44 object-cover" />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                <Upload className="w-7 h-7 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload cover image</span>
                <span className="text-xs text-gray-400 mt-0.5">or drag and drop</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleCoverChange(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gallery Images <span className="text-gray-400 font-normal">(up to 4)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx}>
                  {galleryPreviews[idx] ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={galleryPreviews[idx]}
                        alt={`gallery ${idx + 1}`}
                        className="w-full h-28 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGallery(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                      <ImagePlus className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">Photo {idx + 1}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleGalleryChange(e.target.files?.[0], idx)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
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
          {form.itinerary.map((day, di) => (
            <div key={di} className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{day.day || di + 1}</span>
                </div>
                <input
                  value={day.title}
                  onChange={(e) => updateItinerary(di, "title", e.target.value)}
                  placeholder={`Day ${di + 1} title`}
                  className={inp + " flex-1"}
                />
                {form.itinerary.length > 1 && (
                  <button onClick={() => removeDay(di)} className="p-1.5 text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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
                      <button onClick={() => removeItPoint(di, pi)} className="p-1.5 text-red-400 hover:text-red-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => addItPoint(di)} className="text-sm text-teal-600 hover:underline font-medium">
                  + Add point
                </button>
              </div>
            </div>
          ))}
          <button onClick={addDay} className="flex items-center gap-2 text-sm text-teal-600 hover:underline font-medium">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adult Price (₹) *</label>
                <input
                  type="number"
                  value={form.pricing?.adultPrice}
                  onChange={(e) => setNested("pricing.adultPrice", e.target.value)}
                  placeholder="8999"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Child Price (₹)</label>
                <input
                  type="number"
                  value={form.pricing?.childPrice}
                  onChange={(e) => setNested("pricing.childPrice", e.target.value)}
                  placeholder="5999"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Extra Person (₹)</label>
                <input
                  type="number"
                  value={form.pricing?.extraPersonPrice}
                  onChange={(e) => setNested("pricing.extraPersonPrice", e.target.value)}
                  placeholder="3999"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Price (₹)</label>
                <input
                  type="number"
                  value={form.pricing?.discountPrice}
                  onChange={(e) => setNested("pricing.discountPrice", e.target.value)}
                  placeholder="7999"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">GST (%)</label>
                <input
                  type="number"
                  value={form.pricing?.gstPercent}
                  onChange={(e) => setNested("pricing.gstPercent", e.target.value)}
                  placeholder="5"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Convenience Fee (₹)</label>
                <input
                  type="number"
                  value={form.pricing?.convenienceFee}
                  onChange={(e) => setNested("pricing.convenienceFee", e.target.value)}
                  placeholder="99"
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price Label</label>
                <input
                  value={form.priceLabel}
                  onChange={(e) => set("priceLabel", e.target.value)}
                  placeholder="From ₹7,999/person"
                  className={inp}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Hotel Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hotel Name</label>
                <input
                  value={form.hotelDetails?.hotelName}
                  onChange={(e) => setNested("hotelDetails.hotelName", e.target.value)}
                  placeholder="Hotel Taj Resort"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hotel Category</label>
                <input
                  value={form.hotelDetails?.hotelCategory}
                  onChange={(e) => setNested("hotelDetails.hotelCategory", e.target.value)}
                  placeholder="3 Star / 4 Star"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Type</label>
                <input
                  value={form.hotelDetails?.roomType}
                  onChange={(e) => setNested("hotelDetails.roomType", e.target.value)}
                  placeholder="Deluxe"
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meal Plan</label>
                <input
                  value={form.hotelDetails?.mealPlan}
                  onChange={(e) => setNested("hotelDetails.mealPlan", e.target.value)}
                  placeholder="Breakfast only / MAP / AP"
                  className={inp}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Transport Details</p>
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
                    onChange={(e) => setNested(`transportDetails.${k}`, e.target.checked)}
                    className="accent-teal-600"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup & Drop</label>
                <input
                  value={form.transportDetails?.pickupDrop}
                  onChange={(e) => setNested("transportDetails.pickupDrop", e.target.value)}
                  placeholder="Airport pickup & hotel drop"
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
                <input
                  value={form.transportDetails?.vehicleType}
                  onChange={(e) => setNested("transportDetails.vehicleType", e.target.value)}
                  placeholder="Innova / Tempo Traveller"
                  className={inp}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Availability</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={form.availability?.startDate}
                  onChange={(e) => setNested("availability.startDate", e.target.value)}
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={form.availability?.endDate}
                  onChange={(e) => setNested("availability.endDate", e.target.value)}
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Seats</label>
                <input
                  type="number"
                  value={form.availability?.availableSeats}
                  onChange={(e) => setNested("availability.availableSeats", e.target.value)}
                  placeholder="40"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Booking Deadline</label>
                <input
                  type="date"
                  value={form.availability?.bookingDeadline}
                  onChange={(e) => setNested("availability.bookingDeadline", e.target.value)}
                  className={inp}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Location Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination Name</label>
                <input
                  value={form.locationDetails?.destinationName}
                  onChange={(e) => setNested("locationDetails.destinationName", e.target.value)}
                  placeholder="Goa"
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Map Location URL</label>
                <input
                  value={form.locationDetails?.googleMapUrl}
                  onChange={(e) => setNested("locationDetails.googleMapUrl", e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Point</label>
                <input
                  value={form.locationDetails?.pickupPoint}
                  onChange={(e) => setNested("locationDetails.pickupPoint", e.target.value)}
                  placeholder="Airport / Railway station"
                  className={inp}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meeting Point</label>
                <input
                  value={form.locationDetails?.meetingPoint}
                  onChange={(e) => setNested("locationDetails.meetingPoint", e.target.value)}
                  placeholder="Hotel lobby / main gate"
                  className={inp}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-5">
          <TagListEditor label="Highlights" values={form.highlights} onChange={(v) => set("highlights", v)} />
          <TagListEditor label="Inclusions" values={form.inclusions} onChange={(v) => set("inclusions", v)} />
          <TagListEditor label="Exclusions" values={form.exclusions} onChange={(v) => set("exclusions", v)} />
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Policies</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cancellation Policy</label>
                <textarea
                  value={form.policies?.cancellationPolicy}
                  onChange={(e) => setNested("policies.cancellationPolicy", e.target.value)}
                  rows={3}
                  className={inp + " resize-none"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Refund Policy</label>
                <textarea
                  value={form.policies?.refundPolicy}
                  onChange={(e) => setNested("policies.refundPolicy", e.target.value)}
                  rows={3}
                  className={inp + " resize-none"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Terms & Conditions</label>
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
            <p className="text-sm font-semibold text-gray-800 mb-3">Offer (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Coupon Code</label>
                <input
                  value={form.offer?.couponCode}
                  onChange={(e) => setNested("offer.couponCode", e.target.value)}
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Early Bird Offer</label>
                <input
                  value={form.offer?.earlyBirdOffer}
                  onChange={(e) => setNested("offer.earlyBirdOffer", e.target.value)}
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Festival Offer</label>
                <input
                  value={form.offer?.festivalOffer}
                  onChange={(e) => setNested("offer.festivalOffer", e.target.value)}
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Discount</label>
                <input
                  value={form.offer?.groupDiscount}
                  onChange={(e) => setNested("offer.groupDiscount", e.target.value)}
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
          {coverPreview && (
            <img src={coverPreview} alt="cover" className="w-full h-48 object-cover rounded-xl" />
          )}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{form.title || "—"}</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {destination || "—"}{" "}
                  {form.durationDays || form.durationNights || form.duration ? `· ${form.durationDays || ""}${form.durationDays ? "D" : ""}${form.durationNights ? `/${form.durationNights}N` : ""} ${form.duration || ""}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {price ? `₹${Number(price).toLocaleString()}` : "—"}
                </p>
                <p className="text-xs text-gray-400">per person</p>
              </div>
            </div>
            {(form.categories || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.categories.map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-700">
                    {c}
                  </span>
                ))}
              </div>
            )}
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
          Submit will send this package for admin review. If admin requests changes, you can edit and submit again.
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
          You can also save a draft and complete the remaining steps later.
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {pkg ? "Edit Package" : "Create New Package"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
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
                  style={{ width: `${Math.round(((step + 1) / steps.length) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave("DRAFT")}
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Save Draft
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {renderStep()}
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
            ) : (
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
            )}
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

  useEffect(() => { fetchPackages(); }, []);

  const handleSaved = (pkg) => {
    setPackages((prev) => {
      const exists = prev.find((p) => p._id === pkg._id);
      return exists ? prev.map((p) => (p._id === pkg._id ? pkg : p)) : [pkg, ...prev];
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
            Submit your package for review. The admin will approve it, request changes, or reject it.
            Approved packages are published to the platform with the category assigned by admin.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <Package className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No packages yet</p>
          <p className="text-xs mt-1">Click "New Package" to create your first one</p>
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
                  <img src={pkg.image_url} alt={pkg.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[pkg.status] || "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABELS[pkg.status] || pkg.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{pkg.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pkg.location}</span>
                  {pkg.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.duration}</span>}
                </div>
                <p className="text-sm font-bold text-teal-600 mt-2">₹{Number(pkg.price).toLocaleString()}</p>

                {/* Admin note */}
                {pkg.adminNotes && (
                  <div className={`mt-3 p-2.5 rounded-lg border text-xs ${
                    pkg.status === "NEEDS_REVISION"
                      ? "bg-orange-50 border-orange-200 text-orange-700"
                      : pkg.status === "REJECTED"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-green-50 border-green-200 text-green-700"
                  }`}>
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
                    Published in: <span className="font-semibold">{pkg.approvedCategory}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {["DRAFT", "PENDING", "NEEDS_REVISION", "REJECTED"].includes(
                    pkg.status
                  ) && (
                    <button
                      onClick={() => setFormPkg(pkg)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {pkg.status === "NEEDS_REVISION"
                        ? "Fix & Resubmit"
                        : pkg.status === "DRAFT"
                        ? "Continue"
                        : "Edit"}
                    </button>
                  )}
                  <button
                    onClick={() => setViewPkg(pkg)}
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
          onClose={() => setFormPkg(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
