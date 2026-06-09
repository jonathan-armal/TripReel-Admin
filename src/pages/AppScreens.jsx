import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Smartphone, Plus, Trash2, GripVertical, Image } from "lucide-react";
import { appScreensAPI, uploadAPI } from "../services/api";

export default function AppScreens() {
  const [splashUrl, setSplashUrl] = useState("");
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await appScreensAPI.get();
      setSplashUrl(res.data?.splashImageUrl || "");
      setSlides(res.data?.slides || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = (callback) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await uploadAPI.uploadBase64(reader.result, file.name);
          callback(res.data?.url || "");
        } catch {
          toast.error("Upload failed");
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const saveSplash = async () => {
    setSaving(true);
    try {
      await appScreensAPI.updateSplash(splashUrl);
      toast.success("Splash image saved!");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const saveSlides = async () => {
    setSaving(true);
    try {
      await appScreensAPI.updateSlides(
        slides.map((s, i) => ({ ...s, order: i })),
      );
      toast.success("Slides saved!");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const addSlide = () => {
    setSlides([
      ...slides,
      { imageUrl: "", title: "", description: "", order: slides.length },
    ]);
  };

  const removeSlide = (idx) => {
    setSlides(slides.filter((_, i) => i !== idx));
  };

  const updateSlide = (idx, field, value) => {
    setSlides(slides.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">App Screens</h1>
          <p className="text-sm text-gray-500">
            Manage splash screen and onboarding slider
          </p>
        </div>
      </div>

      {/* Splash Screen */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-1">Splash Screen</h2>
        <p className="text-xs text-gray-400 mb-4">
          Full-screen image shown when app opens (1080x1920 recommended)
        </p>
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <button
              onClick={() => handleUploadImage((url) => setSplashUrl(url))}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              {splashUrl ? "Change Image" : "Upload Image"}
            </button>
            {splashUrl && (
              <button
                onClick={() => setSplashUrl("")}
                className="ml-3 text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
            <button
              onClick={saveSplash}
              disabled={saving}
              className="ml-4 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>
          {splashUrl && (
            <div className="w-20 h-36 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
              <img
                src={splashUrl}
                alt="Splash"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Slides */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Onboarding Slides</h2>
            <p className="text-xs text-gray-400">
              Images + text shown to new users (swipeable carousel)
            </p>
          </div>
          <button
            onClick={addSlide}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50"
          >
            <Plus className="w-3 h-3" /> Add Slide
          </button>
        </div>

        {slides.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No slides. Static fallback images will be used.
          </p>
        ) : (
          <div className="space-y-4">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
              >
                {/* Image */}
                <div className="flex-shrink-0">
                  {slide.imageUrl ? (
                    <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={slide.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => updateSlide(idx, "imageUrl", "")}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        x
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleUploadImage((url) =>
                          updateSlide(idx, "imageUrl", url),
                        )
                      }
                      className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-teal-300 hover:text-teal-500 transition-colors"
                    >
                      <Image className="w-5 h-5 mb-1" />
                      <span className="text-[10px]">Upload</span>
                    </button>
                  )}
                </div>
                {/* Text fields */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-5">
                      {idx + 1}.
                    </span>
                    <input
                      value={slide.title}
                      onChange={(e) =>
                        updateSlide(idx, "title", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="Slide title"
                    />
                  </div>
                  <textarea
                    value={slide.description}
                    onChange={(e) =>
                      updateSlide(idx, "description", e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                    placeholder="Description text"
                  />
                </div>
                {/* Delete */}
                <button
                  onClick={() => removeSlide(idx)}
                  className="p-2 text-red-300 hover:text-red-500 self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {slides.length > 0 && (
          <button
            onClick={saveSlides}
            disabled={saving}
            className="mt-4 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Save Slides
          </button>
        )}
      </div>
    </div>
  );
}
