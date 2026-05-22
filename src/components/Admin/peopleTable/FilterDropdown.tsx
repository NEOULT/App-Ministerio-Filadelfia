// src/components/Admin/peopleTable/FilterDropdown.tsx
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Filter, X } from 'lucide-react'

export interface FiltersState {
  cedula: string
  edadExacta: string
  edadMin: string
  edadMax: string
  bautizado: '' | 'si' | 'no'
  genero: '' | 'M' | 'F'
  deletedOnly: boolean
}

export const DEFAULT_FILTERS: FiltersState = {
  cedula: '',
  edadExacta: '',
  edadMin: '',
  edadMax: '',
  bautizado: '',
  genero: '',
  deletedOnly: false
}

interface FilterDropdownProps {
  filters: FiltersState
  onChange: React.Dispatch<React.SetStateAction<FiltersState>>
  onApply: () => void
  onClear: () => void
  activeCount: number
}

export default function FilterDropdown({
  filters,
  onChange,
  onApply,
  onClear,
  activeCount
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [menuStyles, setMenuStyles] = useState<React.CSSProperties>({})
  const [isPositioned, setIsPositioned] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !dropdownRef.current) {
      setIsPositioned(false)
      return
    }
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const dropdownRect = dropdownRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const gap = 8

    const openAbove = triggerRect.bottom + dropdownRect.height + gap > viewportHeight && triggerRect.top > dropdownRect.height + gap
    const top = openAbove
      ? Math.max(gap, triggerRect.top - dropdownRect.height - gap)
      : Math.min(viewportHeight - dropdownRect.height - gap, triggerRect.bottom + gap)

    const openToLeft = triggerRect.left + dropdownRect.width > viewportWidth - gap
    const left = openToLeft
      ? Math.max(gap, triggerRect.right - dropdownRect.width)
      : Math.min(viewportWidth - dropdownRect.width - gap, triggerRect.left)

    setMenuStyles({ position: 'fixed', top, left, zIndex: 1000 })
    setIsPositioned(true)
  }, [isOpen])

  const handleClear = () => {
    onClear()
    setIsOpen(false)
  }

  const handleApply = () => {
    onApply()
    setIsOpen(false)
  }

  const update = (field: keyof FiltersState, value: string | boolean) => {
    onChange(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="filter-dropdown-container" ref={triggerRef}>
      <button
        className={`action-btn filter-btn ${activeCount > 0 ? 'filter-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <Filter size={18} />
        <span>Filtrar{activeCount > 0 ? ` (${activeCount})` : ''}</span>
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="filter-dropdown-menu"
          style={{ ...menuStyles, visibility: isPositioned ? 'visible' : 'hidden' }}
        >
          <div className="filter-dropdown-header">
            <span>Filtros</span>
            <button className="filter-close-btn" onClick={() => setIsOpen(false)} type="button">
              <X size={16} />
            </button>
          </div>

          <div className="filter-dropdown-body">
            {/* Cédula */}
            <div className="filter-group">
              <label>Cédula</label>
              <input
                type="text"
                value={filters.cedula}
                onChange={(e) => update('cedula', e.target.value)}
                placeholder="Buscar por cédula..."
                className="filter-input"
              />
            </div>

            {/* Edad exacta */}
            <div className="filter-group">
              <label>Edad exacta</label>
              <input
                type="number"
                min="0"
                max="120"
                value={filters.edadExacta}
                onChange={(e) => {
                  update('edadExacta', e.target.value)
                  if (e.target.value) {
                    update('edadMin', '')
                    update('edadMax', '')
                  }
                }}
                placeholder="Ej: 25"
                className="filter-input"
              />
            </div>

            {/* Rango de edades */}
            <div className="filter-group">
              <label>Rango de edades</label>
              <div className="filter-range">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={filters.edadMin}
                  onChange={(e) => {
                    update('edadMin', e.target.value)
                    if (e.target.value || filters.edadMax) update('edadExacta', '')
                  }}
                  placeholder="Mín"
                  className="filter-input range-input"
                />
                <span className="range-separator">—</span>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={filters.edadMax}
                  onChange={(e) => {
                    update('edadMax', e.target.value)
                    if (filters.edadMin || e.target.value) update('edadExacta', '')
                  }}
                  placeholder="Máx"
                  className="filter-input range-input"
                />
              </div>
            </div>

            {/* Bautizado */}
            <div className="filter-group">
              <label>Bautizado</label>
              <select
                value={filters.bautizado}
                onChange={(e) => update('bautizado', e.target.value as FiltersState['bautizado'])}
                className="filter-input"
              >
                <option value="">Todos</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>

            {/* Género */}
            <div className="filter-group">
              <label>Género</label>
              <select
                value={filters.genero}
                onChange={(e) => update('genero', e.target.value as FiltersState['genero'])}
                className="filter-input"
              >
                <option value="">Todos</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            {/* Eliminados */}
            <div className="filter-group">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.deletedOnly}
                  onChange={(e) => update('deletedOnly', e.target.checked)}
                />
                <span>Solo eliminados</span>
              </label>
            </div>
          </div>

          <div className="filter-dropdown-footer">
            <button onClick={handleClear} className="filter-btn-clear" type="button">
              Limpiar filtros
            </button>
            <button onClick={handleApply} className="filter-btn-apply" type="button">
              Aplicar
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
