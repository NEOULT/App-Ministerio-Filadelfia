// src/components/Admin/peopleTable/components/ColumnSelectorModal.tsx
import { useState } from 'react'
import { Check, FileSpreadsheet } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Column, ExtraField } from '../types'

interface ColumnSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  columns: Column<Record<string, unknown>>[]
  extraFields?: ExtraField[]
  onExport: (selectedColumns: Column<Record<string, unknown>>[]) => void
}

export default function ColumnSelectorModal({
  isOpen,
  onClose,
  columns,
  extraFields = [],
  onExport,
}: ColumnSelectorModalProps) {
  const totalItems = columns.length + extraFields.length

  // Inicializar todas las columnas + extrafields como seleccionadas (lazy initializer)
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    () => new Set(columns.map((_, i) => i).concat(extraFields.map((_, i) => columns.length + i)))
  )

  // Resetear selecciones cada vez que se abre el modal
  const handleClose = () => {
    setSelectedIndexes(
      new Set(columns.map((_, i) => i).concat(extraFields.map((_, i) => columns.length + i)))
    )
    onClose()
  }

  const toggleColumn = (index: number) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIndexes(
      new Set(columns.map((_, i) => i).concat(extraFields.map((_, i) => columns.length + i)))
    )
  }

  const deselectAll = () => {
    setSelectedIndexes(new Set())
  }

  /** Convierte un índice a su columna correspondiente (visible o extra) */
  const getColumnAtIndex = (index: number): Column<Record<string, unknown>> => {
    if (index < columns.length) {
      return columns[index]
    }
    const extra = extraFields[index - columns.length]
    // Crear un objeto Column virtual para el campo extra
    return { key: extra.key, label: extra.label }
  }

  const handleExport = () => {
    const selectedColumns = Array.from(selectedIndexes)
      .sort((a, b) => a - b)
      .map((i) => getColumnAtIndex(i))
    onExport(selectedColumns)
  }

  const allSelected = selectedIndexes.size === totalItems
  const noneSelected = selectedIndexes.size === 0

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Seleccionar columnas" size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Descripción */}
        <p
          style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Elige las columnas que deseas incluir en el archivo Excel.
        </p>

        {/* Acciones masivas */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={selectAll}
            disabled={allSelected}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: allSelected ? '#f3f4f6' : 'white',
              color: allSelected ? '#9ca3af' : '#374151',
              cursor: allSelected ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Seleccionar todos
          </button>
          <button
            type="button"
            onClick={deselectAll}
            disabled={noneSelected}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: noneSelected ? '#f3f4f6' : 'white',
              color: noneSelected ? '#9ca3af' : '#374151',
              cursor: noneSelected ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Deseleccionar todos
          </button>

          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.8rem',
              color: '#9ca3af',
              fontWeight: 500,
            }}
          >
            {selectedIndexes.size} de {totalItems}
          </span>
        </div>

        {/* Lista de columnas */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            overflow: 'hidden',
            maxHeight: '360px',
            overflowY: 'auto',
          }}
        >
          {columns.map((column, index) => {
            const isSelected = selectedIndexes.has(index)
            return (
              <label
                key={String(column.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  transition: 'background 0.1s ease',
                  background: isSelected ? '#fafaff' : 'white',
                  borderBottom: index < columns.length - 1 ? '1px solid #f3f4f6' : 'none',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isSelected
                    ? '#fafaff'
                    : 'white'
                }}
              >
                {/* Checkbox personalizado */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    border: `2px solid ${isSelected ? '#6366f1' : '#d1d5db'}`,
                    background: isSelected ? '#6366f1' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                </div>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 500 : 400,
                    color: isSelected ? '#1f2937' : '#6b7280',
                    transition: 'color 0.1s ease',
                  }}
                >
                  {column.label}
                </span>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleColumn(index)}
                  style={{ display: 'none' }}
                />
              </label>
            )
          })}

          {/* Campos adicionales (no visibles en tabla) */}
          {extraFields.length > 0 && (
            <>
              <div style={{
                padding: '8px 14px 4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#6366f1',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: '#f5f3ff',
                borderTop: '1px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
              }}>
                Campos adicionales
              </div>
              {extraFields.map((field, index) => {
                const realIndex = columns.length + index
                const isSelected = selectedIndexes.has(realIndex)
                return (
                  <label
                    key={field.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                      background: isSelected ? '#f5f3ff' : 'white',
                      borderBottom: index < extraFields.length - 1 ? '1px solid #f3f4f6' : 'none',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = isSelected
                        ? '#f5f3ff'
                        : 'white'
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: `2px solid ${isSelected ? '#6366f1' : '#d1d5db'}`,
                        background: isSelected ? '#6366f1' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                    </div>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: isSelected ? 500 : 400,
                        color: isSelected ? '#4f46e5' : '#6b7280',
                        transition: 'color 0.1s ease',
                      }}
                    >
                      {field.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleColumn(realIndex)}
                      style={{ display: 'none' }}
                    />
                  </label>
                )
              })}
            </>
          )}
        </div>

        {/* Botones de acción */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid #f3f4f6',
            margin: '0 -24px',
            padding: '16px 24px 0',
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '8px 20px',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'white'
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={noneSelected}
            style={{
              padding: '8px 20px',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              background: noneSelected ? '#e0e0e0' : '#6366f1',
              color: 'white',
              cursor: noneSelected ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!noneSelected) {
                (e.currentTarget as HTMLElement).style.background = '#4f46e5'
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = noneSelected
                ? '#e0e0e0'
                : '#6366f1'
            }}
          >
            <FileSpreadsheet size={16} />
            Exportar Excel
          </button>
        </div>
      </div>
    </Modal>
  )
}
