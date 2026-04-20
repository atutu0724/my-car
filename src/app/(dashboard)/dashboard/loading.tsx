export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="flex items-center justify-between">
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
