// src/components/Admin/peopleTable/peopleTable.tsx
import { useState, useMemo, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react'
import './PeopleTable.css'
import FilterDropdown, { DEFAULT_FILTERS, type FiltersState } from './FilterDropdown'
import ActionMenu from './components/ActionMenu'
import ColumnSelectorModal from './components/ColumnSelectorModal'
import { useClickOutside } from './hooks/useClickOutside'
import { useFloatingMenu } from './hooks/useFloatingMenu'
import { getRowSortValue, compareSortValues } from './utils/sortUtils'
import { generateBirthdayHTML } from './utils/birthdayExport'
import { exportToExcel } from './utils/excelExport'
import { calcularEdad, getBirthMonthFromFechaNacimiento } from './utils/personUtils'
import type { Column, SortDirection, SortMode, SortState, PeopleTableProps, ExtraField } from './types'

// Re-export for consumers
export type { Column, PeopleTableProps, ColumnAlignment, ExtraField } from './types'

// ─── Constants ────────────────────────────────────────────────────────────────
const SORT_MENU_ESTIMATED_SIZE = { width: 240, height: 96 }
const EXPORT_MENU_ESTIMATED_SIZE = { width: 220, height: 132 }

// ─── PeopleTable component ────────────────────────────────────────────────────
function PeopleTable<T extends Record<string, unknown>>({
  title,
  data,
  columns,
  extraExportFields,
  onSearch,
  onFilter,
  onCreate,
  onEdit,
  onDelete,
  onRestore,
  onView,
  itemsPerPage = 10,
  showActions = true,
  loading = false,
}: PeopleTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FiltersState>({ ...DEFAULT_FILTERS })
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>({ ...DEFAULT_FILTERS })
  const [sortState, setSortState] = useState<SortState>({
    key: null,
    direction: 'asc',
    mode: 'default',
  })

  // Sort menu refs & state
  const sortMenuButtonRef = useRef<HTMLButtonElement>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const {
    styles: sortMenuStyles,
    isPositioned: isSortMenuPositioned,
    estimatePosition: estimateSortMenu,
  } = useFloatingMenu(sortMenuButtonRef, sortMenuRef, isSortMenuOpen, {
    gap: 8,
    alignRight: true,
  })

  // Column selector modal
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false)

  // Export menu refs & state
  const exportButtonRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const {
    styles: exportMenuStyles,
    isPositioned: isExportMenuPositioned,
    estimatePosition: estimateExportMenu,
  } = useFloatingMenu(exportButtonRef, exportMenuRef, isExportOpen, { gap: 8 })

  // Click-outside handlers (shared hook eliminates duplication)
  useClickOutside(
    [sortMenuButtonRef, sortMenuRef],
    () => setIsSortMenuOpen(false),
    isSortMenuOpen
  )
  useClickOutside(
    [exportButtonRef, exportMenuRef],
    () => setIsExportOpen(false),
    isExportOpen
  )

  // ─── Derived data ──────────────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.cedula) count++
    if (appliedFilters.edadExacta) count++
    if (appliedFilters.edadMin || appliedFilters.edadMax) count++
    if (appliedFilters.mesesNacimiento.length) count++
    if (appliedFilters.bautizado) count++
    if (appliedFilters.genero) count++
    if (appliedFilters.deletedOnly) count++
    if (appliedFilters.faltasMin) count++
    return count
  }, [appliedFilters])

  const filteredData = useMemo(() => {
    let result = data

    // Text search (multi-word)
    const trimmed = searchTerm.trim()
    if (trimmed) {
      const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean)
      result = result.filter((row) => {
        const values = Object.values(row)
          .filter((v) => v != null)
          .map((v) => String(v).toLowerCase())
        return words.every((word) => values.some((val) => val.includes(word)))
      })
    }

    // Structured filters
    const f = appliedFilters

    if (f.cedula) {
      const term = f.cedula.toLowerCase()
      result = result.filter((row) => {
        const val = String((row as Record<string, unknown>).cedula ?? '')
        return val.toLowerCase().includes(term)
      })
    }

    if (f.edadExacta) {
      const edadTarget = parseInt(f.edadExacta, 10)
      if (!isNaN(edadTarget)) {
        result = result.filter((row) => {
          const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
          const edad = calcularEdad(fechaNac)
          return edad !== null && edad === edadTarget
        })
      }
    }

    if (f.edadMin || f.edadMax) {
      const min = f.edadMin ? parseInt(f.edadMin, 10) : 0
      const max = f.edadMax ? parseInt(f.edadMax, 10) : Infinity
      if (!isNaN(min) && !isNaN(max)) {
        result = result.filter((row) => {
          const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
          const edad = calcularEdad(fechaNac)
          return edad !== null && edad >= min && edad <= max
        })
      }
    }

    if (f.mesesNacimiento.length) {
      result = result.filter((row) => {
        const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
        const month = getBirthMonthFromFechaNacimiento(fechaNac)
        return month !== null && f.mesesNacimiento.includes(String(month))
      })
    }

    if (f.bautizado) {
      const buscandoSi = f.bautizado === 'si'
      result = result.filter((row) => {
        const val = (row as Record<string, unknown>).bautizado
        return val === buscandoSi
      })
    }

    if (f.genero) {
      result = result.filter((row) => {
        const val = (row as Record<string, unknown>).genero
        return val === f.genero
      })
    }

    if (f.deletedOnly) {
      result = result.filter((row) => Boolean((row as Record<string, unknown>).isDeleted))
    }

    if (f.faltasMin) {
      const faltasMin = parseInt(f.faltasMin, 10)
      if (!isNaN(faltasMin)) {
        result = result.filter((row) => {
          const faltas = (row as Record<string, unknown>).faltas as number | undefined
          return faltas !== undefined && faltas !== null && faltas >= faltasMin
        })
      }
    }

    return result
  }, [data, searchTerm, appliedFilters])

  const sortedData = useMemo(() => {
    if (!sortState.key) return filteredData

    const rows = [...filteredData]
    rows.sort((leftRow, rightRow) => {
      const leftValue = getRowSortValue(leftRow, sortState.key as string, sortState.mode)
      const rightValue = getRowSortValue(rightRow, sortState.key as string, sortState.mode)
      return compareSortValues(leftValue, rightValue, sortState.direction)
    })
    return rows
  }, [filteredData, sortState])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return sortedData.slice(start, end)
  }, [sortedData, currentPage, itemsPerPage])

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchTerm(value)
    setCurrentPage(1)
    onSearch?.(value)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const setSorting = (key: string, direction: SortDirection, mode: SortMode = 'default') => {
    setSortState({ key, direction, mode })
    setCurrentPage(1)
    setIsSortMenuOpen(false)
  }

  const toggleSorting = (key: string) => {
    setSortState((prev) => {
      const nextDirection: SortDirection =
        prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      return { key, direction: nextDirection, mode: key === 'fecha_nacimiento' ? prev.mode : 'default' }
    })
    setCurrentPage(1)
    setIsSortMenuOpen(false)
  }

  const handleExportBirthday = () => {
    const html = generateBirthdayHTML(sortedData as Record<string, unknown>[])
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cumpleanios.html'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setIsExportOpen(false)
  }

  const handleOpenColumnSelector = () => {
    setIsExportOpen(false)
    setIsColumnSelectorOpen(true)
  }

  const handleExportExcel = async (selectedColumns: Column<Record<string, unknown>>[]) => {
    await exportToExcel(sortedData as Record<string, unknown>[], selectedColumns, title)
    setIsColumnSelectorOpen(false)
  }

  const handleSortMenuToggle = () => {
    if (isSortMenuOpen) {
      setIsSortMenuOpen(false)
      return
    }
    estimateSortMenu(SORT_MENU_ESTIMATED_SIZE)
    setIsSortMenuOpen(true)
  }

  const handleExportMenuToggle = () => {
    if (isExportOpen) {
      setIsExportOpen(false)
      return
    }
    estimateExportMenu(EXPORT_MENU_ESTIMATED_SIZE)
    setIsExportOpen(true)
  }

  const clearSorting = (event: React.MouseEvent) => {
    event.stopPropagation()
    setSortState({ key: null, direction: 'asc', mode: 'default' })
    setCurrentPage(1)
  }

  // ─── Render helpers ─────────────────────────────────────────────────────────
  const getSortLabel = (key: string) => {
    if (sortState.key !== key) return null
    if (key === 'fecha_nacimiento') {
      return sortState.mode === 'birthMonthDay' ? 'Mes y día' : 'Fecha'
    }
    return sortState.direction === 'asc' ? 'Ascendente' : 'Descendente'
  }

  const renderSortIcon = (key: string) => {
    if (sortState.key !== key) return <ArrowUpDown size={14} />
    return sortState.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  const getPageNumbers = (): number[] => {
    const pages: number[] = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (column.render) {
      return column.render(row[column.key], row)
    }
    const value = row[column.key]
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    if (value instanceof Date) return value.toLocaleDateString('es-ES')
    return String(value)
  }

  const alignClass = (align?: string) => {
    if (align === 'center') return 'text-center'
    if (align === 'right') return 'text-right'
    return 'text-left'
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="people-table-container">
      {/* Header Section */}
      <div className="people-table-header">
        <h2 className="people-table-title">{title}</h2>

        <div className="people-table-actions">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="export-dropdown-container" ref={exportButtonRef}>
            <button onClick={handleExportMenuToggle} className="action-btn export-btn" type="button">
              <Download size={18} />
              <span>Exportar</span>
            </button>

            {isExportOpen &&
              createPortal(
                <div
                  ref={exportMenuRef}
                  className="export-dropdown-menu"
                  style={{
                    ...exportMenuStyles,
                    visibility: isExportMenuPositioned ? 'visible' : 'hidden',
                  }}
                >
                  <div className="export-dropdown-header">Elige el formato</div>
                  <button
                    type="button"
                    className="export-dropdown-item"
                    onClick={handleExportBirthday}
                  >
                    <span className="export-dropdown-icon">🎂</span>
                    <span>Cumpleaños</span>
                  </button>
                  <button
                    type="button"
                    className="export-dropdown-item"
                    onClick={handleOpenColumnSelector}
                  >
                    <span className="export-dropdown-icon">📊</span>
                    <span>Excel (.xlsx)</span>
                  </button>
                </div>,
                document.body
              )}
          </div>

          <FilterDropdown
            filters={filters}
            onChange={setFilters}
            onApply={() => {
              setAppliedFilters({ ...filters })
              onFilter?.({ ...filters })
              setCurrentPage(1)
            }}
            onClear={() => {
              setFilters({ ...DEFAULT_FILTERS })
              setAppliedFilters({ ...DEFAULT_FILTERS })
              onFilter?.({ ...DEFAULT_FILTERS })
              setCurrentPage(1)
            }}
            activeCount={activeFilterCount}
          />

          <button onClick={onCreate} className="action-btn create-btn" type="button">
            <Plus size={18} />
            <span>Crear Registro</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : (
          <table className="people-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`table-header ${alignClass(column.align)} ${
                      sortState.key === String(column.key) ? 'sorted-column' : ''
                    }`}
                    aria-sort={
                      sortState.key === String(column.key)
                        ? sortState.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <div className="table-header-content">
                      <button
                        type="button"
                        className="table-header-sort-btn"
                        onClick={() => toggleSorting(String(column.key))}
                      >
                        <span>{column.label}</span>
                        <span className="sort-icon">{renderSortIcon(String(column.key))}</span>
                      </button>

                      {String(column.key) === 'fecha_nacimiento' && (
                        <button
                          ref={sortMenuButtonRef}
                          type="button"
                          className="table-header-menu-btn"
                          onClick={handleSortMenuToggle}
                          aria-label="Mostrar opciones de ordenamiento"
                        >
                          <ChevronDown size={14} />
                        </button>
                      )}

                      {sortState.key === String(column.key) && (
                        <span className="sort-badge">
                          {getSortLabel(String(column.key))}
                          <button
                            type="button"
                            className="sort-clear-btn"
                            onClick={clearSorting}
                            aria-label="Limpiar ordenamiento"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {showActions && (
                  <th className="table-header actions-header sticky-actions">Acciones</th>
                )}
              </tr>
            </thead>

            {isSortMenuOpen &&
              createPortal(
                <div
                  ref={sortMenuRef}
                  className="sort-dropdown-menu"
                  style={{
                    ...sortMenuStyles,
                    visibility: isSortMenuPositioned ? 'visible' : 'hidden',
                  }}
                >
                  <button
                    type="button"
                    className="sort-dropdown-item"
                    onClick={() => setSorting('fecha_nacimiento', 'asc', 'birthMonthDay')}
                  >
                    <span
                      className={
                        sortState.key === 'fecha_nacimiento' && sortState.mode === 'birthMonthDay'
                          ? 'sort-dropdown-check'
                          : 'sort-dropdown-check-empty'
                      }
                    >
                      {sortState.key === 'fecha_nacimiento' && sortState.mode === 'birthMonthDay' ? '✓' : ''}
                    </span>
                    Mes y día de nacimiento
                  </button>
                  <button
                    type="button"
                    className="sort-dropdown-item"
                    onClick={() => setSorting('fecha_nacimiento', 'asc', 'default')}
                  >
                    <span
                      className={
                        sortState.key === 'fecha_nacimiento' && sortState.mode === 'default'
                          ? 'sort-dropdown-check'
                          : 'sort-dropdown-check-empty'
                      }
                    >
                      {sortState.key === 'fecha_nacimiento' && sortState.mode === 'default' ? '✓' : ''}
                    </span>
                    Fecha más antiguo
                  </button>
                </div>,
                document.body
              )}

            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <tr key={index} className="table-row">
                    {columns.map((column) => (
                      <td key={String(column.key)} className={`table-cell ${alignClass(column.align)}`}>
                        {getCellValue(row, column)}
                      </td>
                    ))}
                    {showActions && (
                      <td className="table-cell actions-cell sticky-actions">
                        <ActionMenu
                          row={row}
                          onView={onView}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onRestore={onRestore}
                          deletedView={appliedFilters.deletedOnly}
                        />
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (showActions ? 1 : 0)} className="empty-state">
                    No hay datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {filteredData.length > 0 && (
        <div className="pagination-footer">
          <div className="pagination-info">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-nav"
              type="button"
            >
              <ChevronLeft size={18} />
              Anterior
            </button>

            <div className="pagination-pages">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                  type="button"
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-nav"
              type="button"
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
      {/* Column Selector Modal */}
      <ColumnSelectorModal
        isOpen={isColumnSelectorOpen}
        onClose={() => setIsColumnSelectorOpen(false)}
        columns={columns as Column<Record<string, unknown>>[]}
        extraFields={extraExportFields as ExtraField[]}
        onExport={handleExportExcel}
      />
    </div>
  )
}

export default PeopleTable
