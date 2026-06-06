import { useState, useEffect } from "react";
import { Heart, Package, Users, TrendingUp } from "lucide-react";
import { operatorWishlistAPI } from "../../services/api";

export default function OperatorWishlists() {
  const [data, setData] = useState({ total: 0, packages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    operatorWishlistAPI
      .getStats()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wishlists</h1>
          <p className="text-sm text-gray-500">
            See how many users saved your packages
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
          <Heart className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-800">{data.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Saves</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
          <Package className="w-6 h-6 text-teal-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-800">
            {data.packages?.length || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Packages Wishlisted</p>
        </div>
      </div>

      {/* Package List */}
      {data.packages?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No wishlists yet</p>
          <p className="text-xs text-gray-400 mt-1">
            When users save your packages to their wishlist, they'll appear here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <h2 className="text-base font-semibold text-gray-800">
              Most Wishlisted Packages
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.packages.map((pkg, i) => (
              <div
                key={pkg.packageId}
                className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {pkg.title}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {pkg.wishlistCount} user
                        {pkg.wishlistCount !== 1 ? "s" : ""} saved this
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="text-sm font-bold text-rose-600">
                    {pkg.wishlistCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
