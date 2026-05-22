// src/components/Admin/Modals/CreatePersonModal.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { UserPlus, AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import { createPersona, type CreatePersonaPayload } from '@/services/Api'

interface FieldError {
  field: string
  value: unknown
  message: string
}

interface ApiErrorResponse {
  status: string
  code?: string
  message: string
  errors?: FieldError[]
}

interface CreatePersonModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const INITIAL_FORM: CreatePersonaPayload = {
  nombre: '',
  apellido: '',
  cedula: undefined,
  telefono: '',
  email: '',
  fecha_nacimiento: '',
  genero: '',
  bautizado: false,
  ministerio: '',
  nivel_academico: '',
  ocupacion: ''
}

export default function CreatePersonModal({ isOpen, onClose, onSuccess }: CreatePersonModalProps) {
  const [formData, setFormData] = useState<CreatePersonaPayload>({ ...INITIAL_FORM })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const errorRef = useRef<HTMLDivElement | null>(null)

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM })
    setError(null)
    setFieldErrors({})
  }

  useEffect(() => {
    if (!error) return
    requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [error])

  const handleChange = (field: keyof CreatePersonaPayload, value: string | boolean | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error || Object.keys(fieldErrors).length > 0) {
      setError(null)
      setFieldErrors({})
    }
  }

  const extractFieldErrors = useCallback((err: unknown): Record<string, string> => {
    const apiErr = err as { payload?: ApiErrorResponse }
    const payload = apiErr?.payload
    if (!payload?.errors?.length) return {}

    const fieldMap: Record<string, string> = {}
    for (const fieldErr of payload.errors) {
      fieldMap[fieldErr.field] = fieldErr.message
    }
    return fieldMap
  }, [])

  const handleSubmit = async () => {
    const missing: string[] = []
    if (!formData.nombre) missing.push('Nombre')
    if (!formData.apellido) missing.push('Apellido')
    if (!formData.fecha_nacimiento) missing.push('Fecha de nacimiento')
    if (!formData.genero) missing.push('Género')

    if (missing.length > 0) {
      setError(`Campos obligatorios: ${missing.join(', ')}`)
      return
    }

    setLoading(true)
    setError(null)
    setFieldErrors({})
    try {
      await createPersona({
        ...formData,
        genero: formData.genero || undefined,
        nombre_completo: `${formData.nombre} ${formData.apellido}`.trim()
      })
      onSuccess?.()
      onClose()
      resetForm()
    } catch (err) {
      const apiErr = err as { payload?: ApiErrorResponse; message?: string }
      
      // Try to extract field-level errors
      const fieldErrs = extractFieldErrors(err)
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs)
        // Use the general message as the banner
        setError(apiErr?.payload?.message || 'Error de validación')
      } else {
        const message = err instanceof Error ? err.message : 'Error al crear la persona'
        setError(message)
      }
      console.error('Error al crear persona:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      resetForm()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Nuevo Joven" size="lg">
      <div className="create-person-form">
        {/* Header icon */}
        <div className="create-header-icon">
          <UserPlus size={32} strokeWidth={1.5} />
          <span>Ingresa los datos del nuevo joven</span>
        </div>

        {error && (
          <div className="form-error" ref={errorRef}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={formData.nombre || ''}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="form-input"
              placeholder="Ej: Juan"
            />
          </div>
          <div className="form-group">
            <label>Apellido *</label>
            <input
              type="text"
              value={formData.apellido || ''}
              onChange={(e) => handleChange('apellido', e.target.value)}
              className="form-input"
              placeholder="Ej: Pérez"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cédula</label>
            <div className="input-wrapper">
              <input
                type="number"
                value={formData.cedula ?? ''}
                onChange={(e) => handleChange('cedula', e.target.value ? parseInt(e.target.value) : undefined)}
                className={`form-input ${fieldErrors.cedula ? 'input-error' : ''}`}
                placeholder="00000000000"
              />
              {fieldErrors.cedula && (
                <span className="field-error-msg">
                  <AlertCircle size={14} />
                  {fieldErrors.cedula}
                </span>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="text"
              value={formData.telefono || ''}
              onChange={(e) => handleChange('telefono', e.target.value)}
              className="form-input"
              placeholder="+1 809-000-0000"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="form-input"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div className="form-group">
            <label>Fecha de nacimiento *</label>
            <input
              type="date"
              value={formData.fecha_nacimiento || ''}
              onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Género *</label>
            <div className="input-wrapper">
              <select
                value={formData.genero || ''}
                onChange={(e) => handleChange('genero', e.target.value)}
                className={`form-input ${fieldErrors.genero ? 'input-error' : ''}`}
              >
                <option value="" disabled>Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              {fieldErrors.genero && (
                <span className="field-error-msg">
                  <AlertCircle size={14} />
                  {fieldErrors.genero}
                </span>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Bautizado</label>
            <select
              value={formData.bautizado ? 'true' : 'false'}
              onChange={(e) => handleChange('bautizado', e.target.value === 'true')}
              className="form-input"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ministerio</label>
            <input
              type="text"
              value={formData.ministerio || ''}
              onChange={(e) => handleChange('ministerio', e.target.value)}
              className="form-input"
              placeholder="Ej: Alabanza, Teatro..."
            />
          </div>
          <div className="form-group">
            <label>Nivel académico</label>
            <input
              type="text"
              value={formData.nivel_academico || ''}
              onChange={(e) => handleChange('nivel_academico', e.target.value)}
              className="form-input"
              placeholder="Ej: Universitario, Técnico..."
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ocupación</label>
            <input
              type="text"
              value={formData.ocupacion || ''}
              onChange={(e) => handleChange('ocupacion', e.target.value)}
              className="form-input"
              placeholder="Ej: Estudiante, Ingeniero..."
            />
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={handleClose} className="btn-secondary" type="button" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary" type="button" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner" />
                Creando...
              </>
            ) : (
              'Crear Joven'
            )}
          </button>
        </div>
      </div>

      <style>{`
        .create-person-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .create-header-icon {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #6366f1;
          font-size: 0.9rem;
          font-weight: 500;
          padding-bottom: 8px;
          border-bottom: 1px solid #eef2ff;
        }
        .create-header-icon span {
          color: #4b5563;
        }
        .form-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 8px;
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
        .form-input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.2s;
          background: #fff;
        }
        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .form-input::placeholder {
          color: #9ca3af;
        }
        .form-input.input-error {
          border-color: #dc2626;
          background: #fef2f2;
        }
        .form-input.input-error:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }
        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .field-error-msg {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #dc2626;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          margin-top: 8px;
          border-top: 1px solid #e5e7eb;
        }
        @media (max-width: 480px) {
          .modal-actions {
            flex-direction: column;
          }
          .modal-actions button {
            width: 100%;
            justify-content: center;
          }
        }
        .btn-secondary {
          padding: 8px 20px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #374151;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }
        .btn-primary {
          padding: 8px 20px;
          background: #6366f1;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover:not(:disabled) {
          background: #4f46e5;
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  )
}
