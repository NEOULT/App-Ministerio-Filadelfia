import { useEffect, useState } from 'react'
import { getActividades, createActividad, type Actividad, type CreateActividadPayload } from '../../services/Api'
import { Input } from '../Input/Input'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, RefreshCw, Plus } from 'lucide-react'

interface FormData {
  titulo: string
  fecha: Date | null
  descripcion: string
}

export default function ClasesPanel() {
  const [list, setList] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormData>({ titulo: '', fecha: null, descripcion: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [sortField, setSortField] = useState<'titulo' | 'fecha'>('fecha')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const actividades = await getActividades()
      setList(Array.isArray(actividades) ? actividades : [])
    } catch (e) {
      setError((e as Error).message || 'Error al cargar clases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
  const errs: Partial<Record<keyof FormData, string>> = {}
  if (!form.titulo.trim()) errs.titulo = 'El título es requerido'
    if (!form.fecha) errs.fecha = 'La fecha es requerida'
    setFieldErrors(errs)
    if (Object.keys(errs).length) return

    try {
      setSaving(true)
      const payload: CreateActividadPayload = {
        titulo: form.titulo.trim(),
        fecha: form.fecha!.toISOString().split('T')[0],
      }
      if (form.descripcion.trim()) {
        payload.descripcion = form.descripcion.trim()
      }
      await createActividad(payload)
      setForm({ titulo: '', fecha: null, descripcion: '' })
      setShowForm(false)
      await load()
    } catch (e) {
      setError((e as Error).message || 'Error al crear la clase')
    } finally {
      setSaving(false)
    }
  }

  const handleSort = (field: 'titulo' | 'fecha') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedList = [...list].sort((a, b) => {
    const aVal = a[sortField as keyof typeof a] || ''
    const bVal = b[sortField as keyof typeof b] || ''

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
          Gestión de Clases
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Ocultar Formulario' : 'Nueva Clase'}
          </Button>
        </div>
      </div>

      {/* Error Global */}
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

      {/* Formulario */}
      {showForm && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: '1.125rem', fontWeight: 600 }}>
            Crear Nueva Clase
          </h3>
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Título de la clase"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Estudio Bíblico"
                  className={fieldErrors.titulo ? 'border-red-500' : ''}
                />
                {fieldErrors.titulo && <small style={{ color: 'red', fontSize: '0.875rem' }}>{fieldErrors.titulo}</small>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  Fecha
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={`w-full justify-start text-left font-normal ${!form.fecha && 'text-muted-foreground'} ${fieldErrors.fecha ? 'border-red-500' : ''}`}
                      style={{ height: '35px' }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.fecha ? format(form.fecha, 'yyyy-MM-dd') : 'Selecciona una fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.fecha || undefined}
                      onSelect={(date) => setForm({ ...form, fecha: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {fieldErrors.fecha && <small style={{ color: 'red', fontSize: '0.875rem' }}>{fieldErrors.fecha}</small>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                Descripción (opcional)
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Descripción de la actividad"
                rows={3}
                className="border rounded-2xl w-full px-4 py-2 outline-none transition"
                style={{
                  borderColor: '#d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#1f2937',
                  resize: 'vertical'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setForm({ titulo: '', fecha: null, descripcion: '' })
                  setFieldErrors({})
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creando...' : 'Crear Clase'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Clases */}
      {loading ? (
        <div className="flex items-center justify-center py-12" style={{ color: '#6b7280' }}>
          <RefreshCw className="animate-spin mr-2 h-5 w-5" />
          Cargando clases...
        </div>
      ) : sortedList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          border: '2px dashed #e5e7eb',
          borderRadius: '12px',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📚</div>
          <h3 style={{ color: '#374151', marginBottom: '8px' }}>No hay clases registradas</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '16px' }}>
            Comienza creando tu primera clase
          </p>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Clase
            </Button>
          )}
        </div>
      ) : (
        <>
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th
                onClick={() => handleSort('titulo')}
                      style={{
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#374151',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Título {sortField === 'titulo' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('fecha')}
                      style={{
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#374151',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Fecha {sortField === 'fecha' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      Descripción
                    </th>
                    <th style={{
                      padding: '14px 16px',
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
                        padding: '14px 16px',
                        color: '#1f2937',
                        fontWeight: 500
                      }}>
                        {clase.titulo || '-'}
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        color: '#6b7280'
                      }}>
                        {clase.fecha ? new Date(clase.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        color: '#6b7280',
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {clase.descripcion || '-'}
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        textAlign: 'center',
                        color: '#1f2937'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
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

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <span>
              Mostrando {sortedList.length} {sortedList.length === 1 ? 'clase' : 'clases'}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
