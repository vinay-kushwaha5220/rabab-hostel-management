import React from 'react'

interface FilterBarProps {
  onSortChange: (sort: string) => void
  resultsCount: number
  onToggleFilters: () => void
  isFiltersOpen: boolean
  sortBy: string
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  onSortChange, 
  resultsCount, 
  onToggleFilters,
  isFiltersOpen,
  sortBy
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-100 flex flex-col flex-shrink-0">
      <div className="flex items-center h-12 px-4 sm:px-6">
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleFilters}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-bold uppercase tracking-wider text-[9px] transition-all duration-200 ${
                isFiltersOpen 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-600 hover:text-blue-600'
              }`}
            >
              <svg className={`w-3 h-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {isFiltersOpen && window.innerWidth >= 1024 ? 'Hide' : 'Filters'}
            </button>

            <div className="h-5 w-[1px] bg-gray-100"></div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">
                {resultsCount} <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest ml-0.5">{resultsCount === 1 ? 'Room' : 'Rooms'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group">
              <span className="hidden md:inline text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border-none rounded-lg text-[10px] font-bold text-blue-600 outline-none cursor-pointer hover:bg-gray-100 transition-all appearance-none pr-8"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%232563eb\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'3\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '0.8rem' }}
              >
                <option value="newest">Latest</option>
                <option value="luxury_first">Luxury</option>
                <option value="available_first">Available</option>
                <option value="price_low">Price ↑</option>
                <option value="price_high">Price ↓</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterBar
