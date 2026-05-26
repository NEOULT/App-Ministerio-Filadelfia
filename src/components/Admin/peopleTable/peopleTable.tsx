// components/PeopleTable/PeopleTable.tsx
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Search, Download, Plus, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit2, Trash2, RotateCcw, ArrowUpDown, ChevronUp, ChevronDown, X } from 'lucide-react';
import './PeopleTable.css';
import FilterDropdown, { DEFAULT_FILTERS, type FiltersState } from './FilterDropdown';
import { calcularEdad, getBirthMonthFromFechaNacimiento } from './utils/personUtils';

// Tipos específicos para las columnas
export type ColumnAlignment = 'left' | 'center' | 'right';

export interface Column<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  align?: ColumnAlignment;
}

type SortDirection = 'asc' | 'desc';

type SortMode = 'default' | 'birthMonthDay';

interface SortState {
  key: string | null;
  direction: SortDirection;
  mode: SortMode;
}

function getRowSortValue<T extends Record<string, unknown>>(row: T, key: string, mode: SortMode) {
  switch (key) {
    case 'nombreCompleto': {
      const nombre = String((row as Record<string, unknown>).nombre ?? '')
      const apellido = String((row as Record<string, unknown>).apellido ?? '')
      return `${nombre} ${apellido}`.trim()
    }
    case 'cedula': {
      const cedulaValue = Number((row as Record<string, unknown>).cedula)
      return Number.isNaN(cedulaValue) ? null : cedulaValue
    }
    case 'edad': {
      const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
      return calcularEdad(fechaNac)
    }
    case 'fecha_nacimiento': {
      const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
      if (!fechaNac) return null
      const date = new Date(fechaNac)
      if (Number.isNaN(date.getTime())) return null

      if (mode === 'birthMonthDay') {
        return {
          month: date.getMonth(),
          day: date.getDate(),
          year: date.getFullYear(),
          time: date.getTime()
        }
      }

      return date.getTime()
    }
    default: {
      const value = (row as Record<string, unknown>)[key]
      if (value === null || value === undefined) return null
      if (typeof value === 'boolean') return value ? 1 : 0
      if (typeof value === 'number') return value
      return String(value).toLowerCase()
    }
  }
}

function compareSortValues(left: unknown, right: unknown, direction: SortDirection) {
  const multiplier = direction === 'asc' ? 1 : -1

  if (left === null || left === undefined) return right === null || right === undefined ? 0 : 1 * multiplier
  if (right === null || right === undefined) return -1 * multiplier

  if (typeof left === 'object' && typeof right === 'object' && left && right && 'month' in left && 'month' in right) {
    const leftDate = left as { month: number; day: number; year: number; time: number }
    const rightDate = right as { month: number; day: number; year: number; time: number }
    if (leftDate.month !== rightDate.month) return (leftDate.month - rightDate.month) * multiplier
    if (leftDate.day !== rightDate.day) return (leftDate.day - rightDate.day) * multiplier
    if (leftDate.year !== rightDate.year) return (leftDate.year - rightDate.year) * multiplier
    return (leftDate.time - rightDate.time) * multiplier
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * multiplier
  }

  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' })
  return collator.compare(String(left), String(right)) * multiplier
}

// Props del componente con tipos genéricos
export interface PeopleTableProps<T extends Record<string, unknown>> {
  title: string;
  data: T[];
  columns: Column<T>[];
  onSearch?: (searchTerm: string) => void;
  onExport?: () => void;
  onFilter?: (filters: FiltersState) => void;
  onCreate?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRestore?: (row: T) => void;
  onView?: (row: T) => void;
  itemsPerPage?: number;
  showActions?: boolean;
  loading?: boolean;
}

// Componente de menú de acciones
interface ActionMenuProps<T> {
  row: T;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRestore?: (row: T) => void;
  deletedView?: boolean;
}

// ActionMenu component actualizado
function ActionMenu<T>({ row, onView, onEdit, onDelete, onRestore, deletedView = false }: ActionMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [menuStyles, setMenuStyles] = useState<React.CSSProperties>({});
  const [isPositioned, setIsPositioned] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !dropdownRef.current) {
      setIsPositioned(false);
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 8;

    const openAbove = triggerRect.bottom + dropdownRect.height + gap > viewportHeight && triggerRect.top > dropdownRect.height + gap;
    const top = openAbove
      ? Math.max(gap, triggerRect.top - dropdownRect.height - gap)
      : Math.min(viewportHeight - dropdownRect.height - gap, triggerRect.bottom + gap);

    const openToLeft = triggerRect.left + dropdownRect.width > viewportWidth - gap;
    const left = openToLeft
      ? Math.max(gap, triggerRect.right - dropdownRect.width)
      : Math.min(viewportWidth - dropdownRect.width - gap, triggerRect.left);

    setMenuStyles({
      position: 'fixed',
      top,
      left,
      zIndex: 1000,
    });
    setIsPositioned(true);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="action-menu-container" ref={triggerRef}>
      <button
        className="action-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="action-menu-dropdown"
          style={{
            ...menuStyles,
            visibility: isPositioned ? 'visible' : 'hidden',
          }}
        >
          {onView && (
            <button
              className="action-menu-item"
              onClick={() => handleAction(() => onView(row))}
              type="button"
            >
              <Eye size={16} />
              <span>Ver</span>
            </button>
          )}
          {onEdit && (
            <button
              className="action-menu-item"
              onClick={() => handleAction(() => onEdit(row))}
              type="button"
            >
              <Edit2 size={16} />
              <span>Editar</span>
            </button>
          )}
          {deletedView && onRestore ? (
            <button
              className="action-menu-item restore-item"
              onClick={() => handleAction(() => onRestore(row))}
              type="button"
            >
              <RotateCcw size={16} />
              <span>Restaurar</span>
            </button>
          ) : onDelete && (
            <button
              className="action-menu-item delete-item"
              onClick={() => handleAction(() => onDelete(row))}
              type="button"
            >
              <Trash2 size={16} />
              <span>Eliminar</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export interface Persona extends Record<string, unknown> {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: number;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  bautizado?: boolean;
  genero?: string;
  ministerio?: string;
  nivel_academico?: string;
  ocupacion?: string;
  direccion?: string;
  imagen_url?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  __v?: number;
  [key: string]: unknown;
}

function PeopleTable<T extends Record<string, unknown>>({
  title,
  data,
  columns,
  onSearch,
  onExport,
  onFilter,
  onCreate,
  onEdit,
  onDelete,
  onRestore,
  onView,
  itemsPerPage = 10,
  showActions = true,
  loading = false
}: PeopleTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState<FiltersState>({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>({ ...DEFAULT_FILTERS });
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: 'asc', mode: 'default' });
  const sortMenuButtonRef = useRef<HTMLButtonElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortMenuStyles, setSortMenuStyles] = useState<React.CSSProperties>({});
  const [isSortMenuPositioned, setIsSortMenuPositioned] = useState(false);

  // Calcular cuántos filtros activos hay
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.cedula) count++
    if (appliedFilters.edadExacta) count++
    if (appliedFilters.edadMin || appliedFilters.edadMax) count++
    if (appliedFilters.mesesNacimiento.length) count++
    if (appliedFilters.bautizado) count++
    if (appliedFilters.genero) count++
    if (appliedFilters.deletedOnly) count++
    return count
  }, [appliedFilters])

  // Filtrar datos según búsqueda + filtros estructurados
  const filteredData = useMemo(() => {
    let result = data

    // Filtro por búsqueda de texto (soporta múltiples palabras)
    const trimmed = searchTerm.trim()
    if (trimmed) {
      const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean)
      result = result.filter(row => {
        const values = Object.values(row).filter(v => v != null).map(v => String(v).toLowerCase())
        return words.every(word =>
          values.some(val => val.includes(word))
        )
      })
    }

    // Filtros estructurados
    const f = appliedFilters

    if (f.cedula) {
      const term = f.cedula.toLowerCase()
      result = result.filter(row => {
        const val = String((row as Record<string, unknown>).cedula ?? '')
        return val.toLowerCase().includes(term)
      })
    }

    if (f.edadExacta) {
      const edadTarget = parseInt(f.edadExacta, 10)
      if (!isNaN(edadTarget)) {
        result = result.filter(row => {
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
        result = result.filter(row => {
          const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
          const edad = calcularEdad(fechaNac)
          return edad !== null && edad >= min && edad <= max
        })
      }
    }

    if (f.mesesNacimiento.length) {
      result = result.filter(row => {
        const fechaNac = (row as Record<string, unknown>).fecha_nacimiento as string | undefined
        const month = getBirthMonthFromFechaNacimiento(fechaNac)
        return month !== null && f.mesesNacimiento.includes(String(month))
      })
    }

    if (f.bautizado) {
      const buscandoSi = f.bautizado === 'si'
      result = result.filter(row => {
        const val = (row as Record<string, unknown>).bautizado
        return val === buscandoSi
      })
    }

    if (f.genero) {
      result = result.filter(row => {
        const val = (row as Record<string, unknown>).genero
        return val === f.genero
      })
    }

    if (f.deletedOnly) {
      result = result.filter(row => Boolean((row as Record<string, unknown>).isDeleted))
    }

    return result
  }, [data, searchTerm, appliedFilters]);

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

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, itemsPerPage]);

  useEffect(() => {
    if (!isSortMenuOpen || !sortMenuButtonRef.current || !sortMenuRef.current) {
      setIsSortMenuPositioned(false)
      return
    }

    const buttonRect = sortMenuButtonRef.current.getBoundingClientRect()
    const menuRect = sortMenuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const gap = 8

    const top = Math.min(viewportHeight - menuRect.height - gap, buttonRect.bottom + gap)
    const left = Math.min(viewportWidth - menuRect.width - gap, Math.max(gap, buttonRect.right - menuRect.width))

    setSortMenuStyles({ position: 'fixed', top, left, zIndex: 1000 })
    setIsSortMenuPositioned(true)
  }, [isSortMenuOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        sortMenuButtonRef.current &&
        !sortMenuButtonRef.current.contains(target) &&
        sortMenuRef.current &&
        !sortMenuRef.current.contains(target)
      ) {
        setIsSortMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const setSorting = (key: string, direction: SortDirection, mode: SortMode = 'default') => {
    setSortState({ key, direction, mode })
    setCurrentPage(1)
    setIsSortMenuOpen(false)
  }

  const toggleSorting = (key: string) => {
    setSortState(prev => {
      const nextDirection: SortDirection = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      return { key, direction: nextDirection, mode: key === 'fecha_nacimiento' ? prev.mode : 'default' }
    })
    setCurrentPage(1)
    setIsSortMenuOpen(false)
  }

  const clearSorting = (event: React.MouseEvent) => {
    event.stopPropagation()
    setSortState({ key: null, direction: 'asc', mode: 'default' })
    setCurrentPage(1)
  }

  const getSortLabel = (key: string) => {
    if (sortState.key !== key) return null
    return sortState.direction === 'asc' ? 'Ascendente' : 'Descendente'
  }

  const renderSortIcon = (key: string) => {
    if (sortState.key !== key) return <ArrowUpDown size={14} />
    return sortState.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    onSearch?.(value);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    
    const value = row[column.key];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (value instanceof Date) return value.toLocaleDateString('es-ES');
    return String(value);
  };

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
          
          <button 
            onClick={onExport} 
            className="action-btn export-btn"
            type="button"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
          
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
          
          <button 
            onClick={onCreate} 
            className="action-btn create-btn"
            type="button"
          >
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
                    className={`table-header ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 
                      'text-left'
                    } ${sortState.key === String(column.key) ? 'sorted-column' : ''}`}
                    aria-sort={sortState.key === String(column.key) ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
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
                          onClick={() => setIsSortMenuOpen(prev => !prev)}
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
                  <th className="table-header actions-header sticky-actions">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            {isSortMenuOpen && createPortal(
              <div
                ref={sortMenuRef}
                className="sort-dropdown-menu"
                style={{ ...sortMenuStyles, visibility: isSortMenuPositioned ? 'visible' : 'hidden' }}
              >
                <button
                  type="button"
                  className="sort-dropdown-item"
                  onClick={() => setSorting('fecha_nacimiento', 'asc', 'default')}
                >
                  Fecha de nacimiento: más antiguas
                </button>
                <button
                  type="button"
                  className="sort-dropdown-item"
                  onClick={() => setSorting('fecha_nacimiento', 'desc', 'default')}
                >
                  Fecha de nacimiento: más recientes
                </button>
                <button
                  type="button"
                  className="sort-dropdown-item"
                  onClick={() => setSorting('fecha_nacimiento', 'asc', 'birthMonthDay')}
                >
                  Mes y día de nacimiento
                </button>
                <button
                  type="button"
                  className="sort-dropdown-item"
                  onClick={() => setSorting('fecha_nacimiento', 'desc', 'birthMonthDay')}
                >
                  Mes y día de nacimiento inverso
                </button>
              </div>,
              document.body
            )}
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <tr key={index} className="table-row">
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`table-cell ${
                          column.align === 'center' ? 'text-center' : 
                          column.align === 'right' ? 'text-right' : 
                          'text-left'
                        }`}
                      >
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
                  <td
                    colSpan={columns.length + (showActions ? 1 : 0)}
                    className="empty-state"
                  >
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
            {Math.min(currentPage * itemsPerPage, filteredData.length)} de{' '}
            {filteredData.length} registros
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
              {getPageNumbers().map(page => (
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
    </div>
  );
}

export default PeopleTable;