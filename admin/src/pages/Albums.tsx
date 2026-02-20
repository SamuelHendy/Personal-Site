import { Plus, Image } from 'lucide-react'

export default function Albums() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Albums</h1>
          <p className="text-base-content/60 mt-1">Upload and organize photo albums</p>
        </div>
        <button className="btn btn-accent gap-2">
          <Plus className="w-5 h-5" />
          Add Album
        </button>
      </div>
      
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
            <Image className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium">No albums yet</p>
            <p className="text-sm">Create your first album to organize photos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
