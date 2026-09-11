'use client'

import React from 'react'
import { MapPin, X, Globe } from 'lucide-react'
import { INDIAN_STATES, getDistrictsForState } from '@/lib/location/states'

export interface LocationSelectorProps {
  selectedState: string
  selectedDistrict?: string
  onStateChange: (state: string) => void
  onDistrictChange?: (district: string) => void
  className?: string
  compact?: boolean
  showDistrict?: boolean
}

export function LocationSelector({
  selectedState,
  selectedDistrict = '',
  onStateChange,
  onDistrictChange,
  className = '',
  compact = false,
  showDistrict = true,
}: LocationSelectorProps) {
  const availableDistricts = selectedState && selectedState !== 'All India' 
    ? getDistrictsForState(selectedState) 
    : []

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value
    onStateChange(newState)
    if (onDistrictChange) {
      onDistrictChange('') // Reset district when state changes
    }
  }

  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onDistrictChange) {
      onDistrictChange(e.target.value)
    }
  }

  const handleClear = () => {
    onStateChange('All India')
    if (onDistrictChange) {
      onDistrictChange('')
    }
  }

  const isFiltered = selectedState && selectedState !== 'All India'

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* State Selector */}
      <div className="relative inline-flex items-center">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500 pointer-events-none" />
        <select
          value={selectedState || 'All India'}
          onChange={handleStateSelect}
          className={`pl-9 pr-8 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl text-slate-200 text-sm font-medium hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors appearance-none cursor-pointer ${
            compact ? 'text-xs py-1.5' : ''
          }`}
          aria-label="Filter by Indian State or Union Territory"
        >
          <option value="All India">All India (National)</option>
          <optgroup label="States & Union Territories">
            {INDIAN_STATES.map((s) => (
              <option key={s.code} value={s.name}>
                {s.name} ({s.code})
              </option>
            ))}
          </optgroup>
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
          ▼
        </span>
      </div>

      {/* District Selector (optional / conditional) */}
      {showDistrict && availableDistricts.length > 0 && (
        <div className="relative inline-flex items-center">
          <select
            value={selectedDistrict}
            onChange={handleDistrictSelect}
            className={`pl-3 pr-8 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl text-slate-200 text-sm font-medium hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors appearance-none cursor-pointer ${
              compact ? 'text-xs py-1.5' : ''
            }`}
            aria-label="Filter by District"
          >
            <option value="">All Districts ({selectedState})</option>
            {availableDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
            ▼
          </span>
        </div>
      )}

      {/* Clear Button */}
      {isFiltered && (
        <button
          type="button"
          onClick={handleClear}
          title="Reset to All India"
          aria-label="Reset location to All India"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors"
        >
          <X className="h-3 w-3" />
          <span>Reset</span>
        </button>
      )}

      {!compact && (
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
          <Globe className="h-3 w-3 text-slate-400" />
          Manual location selection
        </span>
      )}
    </div>
  )
}
