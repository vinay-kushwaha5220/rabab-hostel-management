import React from 'react'

interface FilterSidebarProps {
  filters: {
    roomType: string
    bookingType: string
  }
  onFilterChange: (key: string, value: any) => void
  onReset: () => void
  onClose?: () => void
  isMobile?: boolean
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  filters, 
  onFilterChange, 
  onReset, 
  onClose,
  isMobile = false 
}) => {
  const content = (
    <div className={`flex flex-col h-full bg-white transition-all duration-300 ${isMobile ? '' : 'w-[240px] border-r border-gray-100 overflow-hidden'}`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-8">
        {isMobile && (
          <div className="flex items-center justify-between mb-2 border-b pb-4">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Filters</h2>
            <button onClick={onClose} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 active:scale-90 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Room Type */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Room Category</h3>
          <div className="space-y-2">
            {[
              { id: 'AC', label: 'AC Rooms', emoji: '❄️' },
              { id: 'NON_AC', label: 'Non AC Rooms', emoji: '💨' }
            ].map((type) => (
              <label key={type.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${filters.roomType === type.id ? 'border-blue-600 bg-blue-50/30' : 'border-gray-50 hover:border-blue-100 bg-gray-50/20'}`}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={filters.roomType === type.id}
                  onChange={() => onFilterChange('roomType', filters.roomType === type.id ? '' : type.id)}
                />
                <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${filters.roomType === type.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}>
                  {filters.roomType === type.id && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-[12px] font-black tracking-tight ${filters.roomType === type.id ? 'text-blue-700' : 'text-gray-600'}`}>
                  {type.emoji} {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Booking Type */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Booking Mode</h3>
          <div className="space-y-2">
            {[
              { id: 'DAILY', label: 'Daily Stay', emoji: '📅' },
              { id: 'MONTHLY', label: 'Monthly Rent', emoji: '🏠' }
            ].map((mode) => (
              <label key={mode.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${filters.bookingType === mode.id ? 'border-blue-600 bg-blue-50/30' : 'border-gray-50 hover:border-blue-100 bg-gray-50/20'}`}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={filters.bookingType === mode.id}
                  onChange={() => onFilterChange('bookingType', filters.bookingType === mode.id ? '' : mode.id)}
                />
                <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${filters.bookingType === mode.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}>
                  {filters.bookingType === mode.id && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-[12px] font-black tracking-tight ${filters.bookingType === mode.id ? 'text-blue-700' : 'text-gray-600'}`}>
                  {mode.emoji} {mode.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-white border-t border-gray-50 space-y-2">
        <button
          onClick={onReset}
          className="w-full h-10 bg-gray-50 text-gray-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all active:scale-95"
        >
          Reset All
        </button>
        {isMobile && (
          <button
            onClick={onClose}
            className="w-full h-11 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 active:scale-95 transition-all"
          >
            Show Rooms
          </button>
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[60] lg:hidden">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
        <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-[40px] overflow-hidden animate-in slide-in-from-bottom duration-500">
          {content}
        </div>
      </div>
    )
  }

  return content
}

export default FilterSidebar
