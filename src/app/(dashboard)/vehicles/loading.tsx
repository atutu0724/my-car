export default function VehiclesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-8 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 last:border-0">
            <div className="grid grid-cols-8 gap-4">
              {[...Array(8)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
