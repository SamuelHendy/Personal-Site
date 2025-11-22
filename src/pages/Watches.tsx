export default function Watches() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Watches</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Watch cards will go here */}
        <div className="border border-gray-800 rounded-lg p-6 hover:border-gray-600 transition-colors">
          <h2 className="text-2xl font-semibold mb-2">Watch 1</h2>
          <p className="text-gray-400">Coming soon...</p>
        </div>
      </div>
    </div>
  )
}
