import { useEffect, useState } from 'react'
import { getPersonas, type Persona, type PaginatedResponse } from '../../services/Api'
import { Input } from '../Input/Input'
import { Button } from '../ui/button'
import { Search, X, RefreshCw, User, Mail, Phone, IdCard } from 'lucide-react'

export default function PersonasList() {
  const [list, setList] = useState<Persona[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cedula, setCedula] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [sortField, setSortField] = useState<keyof Persona | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [totalItems, setTotalItems] = useState(0)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getPersonas({
        cedula: cedula.trim() || undefined,
        nombreCompleto: nombreCompleto.trim() || undefined,
        limit: 100
      })
      
      // getPersonas devuelve PaginatedResponse<Persona>
      const raw = Array.isArray((data as PaginatedResponse<unknown>).data) ? ((data as PaginatedResponse<unknown>).data as unknown[]) : []
      // Normalize backend objects to the Persona shape the UI expects
      const normalized = raw.map((p: unknown) => {
        const obj = p as Record<string, unknown>;
        const nombre = typeof obj.nombre === 'string' ? obj.nombre : '';
        const apellido = typeof obj.apellido === 'string' ? obj.apellido : '';
        const nombreCompleto = typeof obj.nombreCompleto === 'string'
          ? obj.nombreCompleto
          : `${nombre} ${apellido}`.trim();
        const ced = obj.cedula !== undefined ? String(obj.cedula) : '';
        return {
          _id: String(obj._id ?? ''),
          cedula: ced,
          nombreCompleto,
          email: typeof obj.email === 'string' ? obj.email : undefined,
          telefono: typeof obj.telefono === 'string' ? String(obj.telefono) : undefined,
          fechaNacimiento: typeof obj.fecha_nacimiento === 'string'
            ? obj.fecha_nacimiento
            : (typeof obj.fechaNacimiento === 'string' ? obj.fechaNacimiento : undefined),
          direccion: typeof obj.direccion === 'string' ? obj.direccion : undefined,
          bautizado: typeof obj.bautizado === 'boolean' ? obj.bautizado : undefined,
          genero: typeof obj.genero === 'string' ? obj.genero : undefined,
          ministerio: typeof obj.ministerio === 'string' ? obj.ministerio : undefined,
          nivel_academico: typeof obj.nivel_academico === 'string' ? obj.nivel_academico : undefined,
          ocupacion: typeof obj.ocupacion === 'string' ? obj.ocupacion : undefined,
          createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : undefined,
          updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
        } as Persona;
      });
      setList(normalized);
  setTotalItems(((data as PaginatedResponse<Persona>)?.totalItems) || normalized.length);
    } catch (err) {
      setError((err as Error).message || 'Error al cargar jóvenes')
      setList([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  const handleClear = () => {
    setCedula('')
    setNombreCompleto('')
    setSortField('')
    setSortOrder('asc')
  }

  const handleSort = (field: keyof Persona) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedList = [...list].sort((a, b) => {
    if (!sortField) return 0
    const aVal = String(a[sortField] || '')
    const bVal = String(b[sortField] || '')
    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
            Lista de Jóvenes
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            {totalItems} {totalItems === 1 ? 'joven registrado' : 'jóvenes registrados'}
          </p>
        </div>
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

      {/* Filtros */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="Buscar por cédula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Ej: 1234567890"
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
          <Input
            label="Buscar por nombre"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder="Ej: Juan Pérez"
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={!cedula && !nombreCompleto}
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar
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

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12" style={{ color: '#6b7280' }}>
          <RefreshCw className="animate-spin mr-2 h-5 w-5" />
          Cargando jóvenes...
        </div>
      ) : sortedList.length === 0 ? (
        /* Empty State */
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          border: '2px dashed #e5e7eb',
          borderRadius: '12px',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👥</div>
          <h3 style={{ color: '#374151', marginBottom: '8px' }}>
            {cedula || nombreCompleto ? 'No se encontraron resultados' : 'No hay jóvenes registrados'}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {cedula || nombreCompleto 
              ? 'Intenta con otros criterios de búsqueda' 
              : 'Los jóvenes registrados aparecerán aquí'
            }
          </p>
        </div>
      ) : (
        /* Table */
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{
              minWidth: '1200px',
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th
                    onClick={() => handleSort('nombreCompleto')}
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
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nombre Completo {sortField === 'nombreCompleto' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('cedula')}
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
                    <div className="flex items-center gap-2">
                      <IdCard className="h-4 w-4" />
                      Cédula {sortField === 'cedula' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </th>
                  <th style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </div>
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Bautizado</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Género</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Ministerio</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Nivel académico</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Ocupación</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Fecha nacimiento</th>
                </tr>
              </thead>
              <tbody>
                {sortedList.map((persona, index) => (
                  <tr
                    key={persona._id || index}
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
                      {persona.nombreCompleto || '-'}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#6b7280',
                      fontFamily: 'monospace'
                    }}>
                      {persona.cedula || '-'}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#6b7280',
                      maxWidth: '250px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {persona.email || '-'}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#6b7280',
                      fontFamily: 'monospace'
                    }}>
                      {persona.telefono || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>
                      {typeof persona.bautizado === 'boolean' ? (persona.bautizado ? 'Sí' : 'No') : '-'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>
                      {persona.genero || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {persona.ministerio || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>
                      {persona.nivel_academico || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>
                      {persona.ocupacion || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>
                      {persona.fechaNacimiento ? new Date(persona.fechaNacimiento).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
