import { useState } from 'react'
import { Plus, Fish, Calendar } from 'lucide-react'

export default function Fishtank() {
  const [activeTab, setActiveTab] = useState<'residents' | 'timeline'>('residents')

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fishtank</h1>
          <p className="text-base-content/60 mt-1">Manage residents and timeline events</p>
        </div>
        <button className="btn btn-secondary gap-2">
          <Plus className="w-5 h-5" />
          {activeTab === 'residents' ? 'Add Resident' : 'Add Event'}
        </button>
      </div>
      
      <div role="tablist" className="tabs tabs-boxed mb-6 w-fit">
        <button 
          role="tab" 
          className={`tab ${activeTab === 'residents' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('residents')}
        >
          Residents
        </button>
        <button 
          role="tab" 
          className={`tab ${activeTab === 'timeline' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      {activeTab === 'residents' && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="bg-base-200">
                    <th>Name</th>
                    <th>Species</th>
                    <th>Added</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                        <Fish className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-medium">No residents yet</p>
                        <p className="text-sm">Add your first fishtank resident</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
              <Calendar className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium">No timeline events yet</p>
              <p className="text-sm">Add your first event to track fishtank history</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
