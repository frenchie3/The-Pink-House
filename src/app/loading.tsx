export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-white/80 backdrop-blur-sm">
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-pink-200 rounded-xl blur-xl opacity-30 animate-pulse"></div>
          <div className="relative grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-pink-600 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.8s",
                }}
              ></div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-medium text-gray-800 mb-1">
            Loading your experience
          </h3>
          <p className="text-gray-600">
            Please wait while we prepare everything for you
          </p>
        </div>
      </div>
    </div>
  );
}
