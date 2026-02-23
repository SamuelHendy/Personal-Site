import ImageManagementModalGeneric from './ImageManagementModal.generic'

interface ImageManagementModalProps {
  isOpen: boolean
  onClose: () => void
  brand: string
  model: string
  onStatusChange?: (pendingFiles: string[]) => void
}

// Wrapper for watches - uses the generic component
export default function ImageManagementModal({ isOpen, onClose, brand, model, onStatusChange }: ImageManagementModalProps) {
  return (
    <ImageManagementModalGeneric
      isOpen={isOpen}
      onClose={onClose}
      contentType="watches"
      identifier={`${brand}/${model}`}
      displayName={`${brand} ${model}`}
      onStatusChange={onStatusChange}
    />
  )
}
