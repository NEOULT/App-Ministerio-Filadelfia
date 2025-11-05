import { useEffect, useState } from 'react'
import { getActividades } from '@/services/Api'
import type { Actividad } from '@/services/Api'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface ClasesListProps {
  reloadSignal?: number
}

export default function ClasesList({ reloadSignal = 0 }: ClasesListProps) {
  const [list, setList] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortField, setSortField] = useState<'titulo' | 'fecha'>('fecha')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getActividades()
      setList(Array.isArray(data) ? data : [])
    } catch (e) {
      setError((e as Error).message || 'Error al cargar clases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (reloadSignal) load() }, [reloadSignal])

  const handleSort = (field: 'titulo' | 'fecha') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedList = [...list].sort((a, b) => {
    const aVal = a[sortField] || ''
    const bVal = b[sortField] || ''
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" style={{ color: '#6b7280' }}>
        <RefreshCw className="animate-spin mr-2 h-5 w-5" />
        Cargando clases...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
          Lista de Clases
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {sortedList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          No hay clases registradas
        </div>
      ) : (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th
                    onClick={() => handleSort('titulo')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Título {sortField === 'titulo' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('fecha')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Fecha {sortField === 'fecha' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Descripción
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    # Asistentes
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedList.map((clase, index) => (
                  <tr
                    key={clase._id || index}
                    style={{
                      borderBottom: index < sortedList.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <td style={{
                      padding: '12px 16px',
                      color: '#1f2937',
                      fontWeight: 500
                    }}>
                      {clase.titulo || '-'}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      color: '#6b7280'
                    }}>
                      {clase.fecha ? new Date(clase.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : '-'}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      color: '#6b7280',
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {clase.descripcion || '-'}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      color: '#1f2937'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {clase.asistentes?.length || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedList.length > 0 && (
        <div style={{
          textAlign: 'right',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          Total: {sortedList.length} {sortedList.length === 1 ? 'clase' : 'clases'}
        </div>
      )}
    </div>
  )
}
