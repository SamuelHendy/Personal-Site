import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { api } from '../config/api'

interface QRCodeModalProps {
  websiteUrl?: string
  instagramHandle?: string
  linkedinHandle?: string
  // vCard fields
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  jobTitle?: string
  company?: string
  birthday?: string
  note?: string
}

export default function QRCodeModal({ 
  websiteUrl = 'https://samhendy.com',
  instagramHandle = 'sam.hendy_', 
  linkedinHandle = 'samuel-hendy-958773179',
  firstName = 'Samuel',
  lastName = 'Hendy',
  email = 'samuel@hedgehill.uk',
  phone = '+447562508583',
  jobTitle = '',
  company = '',
  birthday = '2001-03-03',
  note = 'This guy gave me a QR code, who does he think he is?!'
}: QRCodeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [qrMode, setQrMode] = useState<'url' | 'vcard'>('vcard')

  // Generate vCard string
  const generateVCard = () => {
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n'
    vcard += `N:${lastName};${firstName};;;\n`
    vcard += `FN:${firstName} ${lastName}\n`
    if (jobTitle) vcard += `TITLE:${jobTitle}\n`
    if (company) vcard += `ORG:${company}\n`
    if (phone) vcard += `TEL;TYPE=CELL:${phone}\n`
    if (email) vcard += `EMAIL:${email}\n`
    if (birthday) vcard += `BDAY:${birthday}\n`
    if (note) vcard += `NOTE:${note}\n`
    vcard += `URL:${websiteUrl}\n`
    vcard += 'END:VCARD'
    return vcard
  }

  const qrValue = qrMode === 'url' ? websiteUrl : generateVCard()

  return (
    <>
      {/* Notch-style pull tab - mobile only */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden absolute top-0 left-1/2 -translate-x-1/2 z-50 w-[75%] bg-base-300 border border-t-0 border-base-content/30 text-base-content py-1 rounded-b-xl flex items-center justify-center shadow-lg"
        aria-label="Open contact card"
      >
        <ChevronDown size={16} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-0"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Content - slides down from top */}
          <div
            className="relative bg-base-100 border border-base-content w-[85%] -mt-[30px] pt-[30px] rounded-b-2xl overflow-hidden animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-10 right-4 w-8 h-8 flex items-center justify-center text-base-content/50 hover:text-base-content transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="p-6 pt-12 flex flex-col items-center gap-6">
              {/* QR Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setQrMode('vcard')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    qrMode === 'vcard' 
                      ? 'bg-primary text-primary-content' 
                      : 'bg-base-200 text-base-content hover:bg-base-300'
                  }`}
                >
                  Contact Card
                </button>
                <button
                  onClick={() => setQrMode('url')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    qrMode === 'url' 
                      ? 'bg-primary text-primary-content' 
                      : 'bg-base-200 text-base-content hover:bg-base-300'
                  }`}
                >
                  Website
                </button>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG 
                  value={qrValue} 
                  size={180}
                  level="M"
                />
              </div>

              {/* Label */}
              <p className="text-sm text-base-content/70 font-mono">
                {qrMode === 'url' ? 'samhendy.com' : `${firstName} ${lastName}`}
              </p>

              {/* Social links */}
              <div className="w-full flex flex-col gap-3">
                {/* Instagram */}
                <a
                  href={api.social('instagram')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-base-200 border border-base-content/20 rounded-lg hover:bg-primary hover:text-primary-content transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span className="text-sm font-medium">@{instagramHandle}</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={api.social('linkedin')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-base-200 border border-base-content/20 rounded-lg hover:bg-primary hover:text-primary-content transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="text-sm font-medium">Samuel Hendy</span>
                </a>
              </div>

              {/* Pull up to close indicator */}
              <button
                onClick={() => setIsOpen(false)}
                className="mt-2 text-base-content/50 hover:text-base-content transition-colors"
              >
                <ChevronUp size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
