import { useState } from 'react'

interface ImageSliderProps {
  images: string[]
  alt: string
}

const ImageSlider: React.FC<ImageSliderProps> = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative w-full h-full group/slider">
      <img
        src={images[currentIndex]}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
      />
      
      {images.length > 1 && (
        <>
          {/* Controls */}
          <button
            onClick={handlePrev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 text-gray-800 opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-white shadow-sm backdrop-blur-[2px]"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 text-gray-800 opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-white shadow-sm backdrop-blur-[2px]"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicators */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-3 bg-white' : 'w-1 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ImageSlider
