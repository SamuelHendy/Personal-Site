import { Plus, Clock } from 'lucide-react'

export default function Watches() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Watches</h1>
          <p className="text-base-content/60 mt-1">Manage your watch collection</p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus className="w-5 h-5" />
          Add Watch
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-base-200">
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                      <Clock className="w-12 h-12 mb-4 opacity-50" />
                      <p className="font-medium">No watches yet</p>
                      <p className="text-sm">Add your first watch to get started</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
