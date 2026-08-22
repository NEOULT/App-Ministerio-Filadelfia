// src/components/Admin/Modals/EditPersonModal.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { AlertCircle, Upload, Loader2 } from 'lucide-react'
import { type Persona } from '@/components/Admin/peopleTable/peopleTable'
import Modal from '@/components/ui/Modal/Modal'

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

interface EditPersonModalProps {
  isOpen: boolean
  onClose: () => void
  persona: Persona | null
  onSave: (updatedPersona: Partial<Persona>) => void
}

export default function EditPersonModal({ isOpen, onClose, persona, onSave }: EditPersonModalProps) {
  const [formData, setFormData] = useState<Partial<Persona>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const errorRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState(persona?.imagen_url || '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (persona) {
      setFormData({
        nombre: persona.nombre,
        apellido: persona.apellido,
        cedula: persona.cedula,
        telefono: persona.telefono || '',
        email: persona.email || '',
        fecha_nacimiento: persona.fecha_nacimiento?.split('T')[0] || '',
        genero: persona.genero || '',
        bautizado: persona.bautizado || false,
        ministerio: persona.ministerio || '',
        nivel_academico: persona.nivel_academico || '',
        ocupacion: persona.ocupacion || '',
        direccion: persona.direccion || ''
      })
      setImageUrl(persona.imagen_url || '')
    }
  }, [persona])

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

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error || Object.keys(fieldErrors).length > 0) {
      setError(null)
      setFieldErrors({})
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setFieldErrors({})
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      const apiErr = error as { payload?: ApiErrorResponse; message?: string }
      const fieldErrs = extractFieldErrors(error)
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs)
        setError(apiErr?.payload?.message || 'Error de validación')
      } else {
        setError(error instanceof Error ? error.message : 'Error al guardar')
      }
      console.error('Error al guardar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError(null)
    setUploading(true)

    try {
      const { uploadImage } = await import('@/utils/imageUpload')
      const result = await uploadImage(file)
      setImageUrl(result.url)
      setFormData(prev => ({ ...prev, imagen_url: result.url }))
    } catch (error: unknown) {
      const err = error as { message?: string }
      setUploadError(err.message || 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  if (!persona) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Joven" size="lg">
      <div className="edit-person-form">
        {error && (
          <div className="form-error" ref={errorRef}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Zona de subir imagen */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? '#6366f1' : '#e5e7eb'}`,
              borderRadius: '16px',
              padding: imageUrl ? '12px' : '28px 32px',
              textAlign: 'center',
              cursor: uploading ? 'default' : 'pointer',
              backgroundColor: dragActive ? '#f5f3ff' : '#fafafa',
              transition: 'all 0.15s',
              width: imageUrl ? 'auto' : '100%',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
                e.target.value = ''
              }}
            />

            {uploading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px 0' }}>
                <Loader2 size={20} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Subiendo imagen...</span>
              </div>
            ) : imageUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb' }}
                />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>Imagen actual</div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Haz clic para cambiar</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Upload size={20} style={{ color: '#9ca3af' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Arrastra la foto aquí o </span>
                  <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>haz clic</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>JPG, PNG o WebP • Máx 5MB</div>
              </div>
            )}
          </div>
          {uploadError && (
            <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', fontSize: '0.8rem', color: '#dc2626' }}>
              {uploadError}
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={formData.nombre || ''}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Apellido *</label>
            <input
              type="text"
              value={formData.apellido || ''}
              onChange={(e) => handleChange('apellido', e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cédula *</label>
            <div className="input-wrapper">
              <input
                type="number"
                value={formData.cedula || ''}
                onChange={(e) => handleChange('cedula', parseInt(e.target.value))}
                className={`form-input ${fieldErrors.cedula ? 'input-error' : ''}`}
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
            />
          </div>
          <div className="form-group">
            <label>Fecha de nacimiento</label>
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
            <label>Género</label>
            <select
              value={formData.genero || ''}
              onChange={(e) => handleChange('genero', e.target.value)}
              className="form-input"
            >
              <option value="">Seleccionar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
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
            />
          </div>
          <div className="form-group">
            <label>Nivel académico</label>
            <input
              type="text"
              value={formData.nivel_academico || ''}
              onChange={(e) => handleChange('nivel_academico', e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Ocupación</label>
          <input
            type="text"
            value={formData.ocupacion || ''}
            onChange={(e) => handleChange('ocupacion', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary" type="button">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading} type="button">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <style>{`
        .edit-person-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
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
        .form-input, .form-textarea {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .form-input.input-error {
          border-color: #dc2626;
          background: #fef2f2;
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
        .btn-secondary:hover {
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
        }
        .btn-primary:hover {
          background: #4f46e5;
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </Modal>
  )
}