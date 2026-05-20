// components/PeopleTable/PeopleTable.tsx
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Search, Download, Filter, Plus, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit2, Trash2 } from 'lucide-react';
import './PeopleTable.css';

// Tipos específicos para las columnas
export type ColumnAlignment = 'left' | 'center' | 'right';

export interface Column<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  align?: ColumnAlignment;
}

// Props del componente con tipos genéricos
export interface PeopleTableProps<T extends Record<string, unknown>> {
  title: string;
  data: T[];
  columns: Column<T>[];
  onSearch?: (searchTerm: string) => void;
  onExport?: () => void;
  onFilter?: () => void;
  onCreate?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
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
}

// ActionMenu component actualizado
function ActionMenu<T>({ row, onView, onEdit, onDelete }: ActionMenuProps<T>) {
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
          {onDelete && (
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
  imagen_url?: string;
  createdAt?: string;
  updatedAt?: string;
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
  onView,
  itemsPerPage = 10,
  showActions = true,
  loading = false
}: PeopleTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filtrar datos según búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    return data.filter(row => {
      return Object.values(row).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, itemsPerPage]);

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
          
          <button 
            onClick={onFilter} 
            className="action-btn filter-btn"
            type="button"
          >
            <Filter size={18} />
            <span>Filtrar</span>
          </button>
          
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
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
                {showActions && (
                  <th className="table-header actions-header sticky-actions">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
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