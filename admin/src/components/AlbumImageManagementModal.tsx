import ImageManagementModalGeneric from './ImageManagementModal.generic'

interface AlbumImageManagementModalProps {
  isOpen: boolean
  onClose: () => void
  albumName: string
  onStatusChange?: (pendingFiles: string[]) => void
}

// Wrapper for albums - uses the generic component
export default function AlbumImageManagementModal({ isOpen, onClose, albumName, onStatusChange }: AlbumImageManagementModalProps) {
  return (
    <ImageManagementModalGeneric
      isOpen={isOpen}
      onClose={onClose}
      contentType="albums"
      identifier={albumName}
      displayName={albumName.replace(/_/g, ' ')}
      onStatusChange={onStatusChange}
    />
  )
}
