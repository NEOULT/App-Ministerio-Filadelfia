// src/components/Admin/peopleTable/FilterDropdown.tsx
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Filter, X } from 'lucide-react'
import { useClickOutside } from './hooks/useClickOutside'
import { useFloatingMenu } from './hooks/useFloatingMenu'

export interface FiltersState {
  cedula: string
  edadExacta: string
  edadMin: string
  edadMax: string
  mesesNacimiento: string[]
  bautizado: '' | 'si' | 'no'
  genero: '' | 'M' | 'F'
  deletedOnly: boolean
  faltasMin: string
}

const MONTH_OPTIONS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
]

export const DEFAULT_FILTERS: FiltersState = {
  cedula: '',
  edadExacta: '',
  edadMin: '',
  edadMax: '',
  mesesNacimiento: [],
  bautizado: '',
  genero: '',
  deletedOnly: false,
  faltasMin: ''
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
  const { styles: menuStyles, isPositioned } = useFloatingMenu(triggerRef, dropdownRef, isOpen)

  useClickOutside([triggerRef, dropdownRef], () => setIsOpen(false), isOpen)

  const handleClear = () => {
    onClear()
    setIsOpen(false)
  }

  const handleApply = () => {
    onApply()
    setIsOpen(false)
  }

  const update = (field: keyof FiltersState, value: string | boolean | string[]) => {
    onChange(prev => ({ ...prev, [field]: value }))
  }

  const toggleMonth = (month: string) => {
    const selectedMonths = filters.mesesNacimiento.includes(month)
      ? filters.mesesNacimiento.filter(value => value !== month)
      : [...filters.mesesNacimiento, month]

    update('mesesNacimiento', selectedMonths)
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

            {/* Meses de nacimiento */}
            <div className="filter-group">
              <label>Meses de nacimiento</label>
              <div className="month-grid" role="group" aria-label="Seleccionar meses de nacimiento">
                {MONTH_OPTIONS.map(month => {
                  const isSelected = filters.mesesNacimiento.includes(month.value)
                  return (
                    <button
                      key={month.value}
                      type="button"
                      className={`month-option ${isSelected ? 'month-option-selected' : ''}`}
                      onClick={() => toggleMonth(month.value)}
                      aria-pressed={isSelected}
                    >
                      {month.label}
                    </button>
                  )
                })}
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

            {/* Faltas mínimas */}
            <div className="filter-group">
              <label>Faltas mínimas</label>
              <input
                type="number"
                min="0"
                value={filters.faltasMin}
                onChange={(e) => update('faltasMin', e.target.value)}
                placeholder="Ej: 3"
                className="filter-input"
              />
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
