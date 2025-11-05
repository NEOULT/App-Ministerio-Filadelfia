import { useEffect, useState } from 'react'
import { getActividades, type Actividad } from '@/services/Api'
import { formatDateStringForDisplay } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RefreshCw, Calendar, Users, FileText } from 'lucide-react'

export default function ActividadesList() {
  const [list, setList] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getActividades()
      setList(Array.isArray(data) ? data : [])
    } catch (err) {
      setError((err as Error).message || 'Error al cargar actividades')
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const sortedList = [...list].sort((a, b) => {
    const aDate = a.fecha || ''
    const bDate = b.fecha || ''
    return sortOrder === 'asc' ? (aDate > bDate ? 1 : -1) : (aDate < bDate ? 1 : -1)
  })

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: '#6b7280' }}>
        <RefreshCw className="animate-spin mr-2 h-5 w-5" />
        Cargando actividades...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
            Actividades y Clases
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            {sortedList.length} {sortedList.length === 1 ? 'actividad registrada' : 'actividades registradas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSort}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {sortOrder === 'desc' ? 'Más recientes' : 'Más antiguas'}
          </Button>
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
      </div>

      {/* Error Message */}
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

      {/* Empty State */}
      {sortedList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          border: '2px dashed #e5e7eb',
          borderRadius: '12px',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📅</div>
          <h3 style={{ color: '#374151', marginBottom: '8px' }}>No hay actividades registradas</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Las actividades aparecerán aquí cuando se creen
          </p>
        </div>
      ) : (
        /* Activities List */
        <div style={{ display: 'grid', gap: '16px' }}>
          {sortedList.map((actividad) => (
            <div
              key={actividad._id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: '#1f2937',
                  flex: 1
                }}>
                  {actividad.titulo || 'Sin título'}
                </h3>
                {actividad.fecha && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    <Calendar className="h-3 w-3" />
                    {formatDateStringForDisplay(actividad.fecha, 'es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                )}
              </div>

              {/* Description */}
              {actividad.descripcion && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  borderLeft: '3px solid #3b82f6'
                }}>
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" style={{ color: '#9ca3af' }} />
                  <p style={{ 
                    margin: 0, 
                    color: '#4b5563', 
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}>
                    {actividad.descripcion}
                  </p>
                </div>
              )}

              {/* Asistentes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}>
                  <Users className="h-4 w-4" style={{ color: '#16a34a' }} />
                  <span style={{ color: '#15803d', fontWeight: 500 }}>
                    {actividad.asistentes?.length || 0}
                  </span>
                  <span style={{ color: '#16a34a' }}>
                    {actividad.asistentes?.length === 1 ? 'asistente' : 'asistentes'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
