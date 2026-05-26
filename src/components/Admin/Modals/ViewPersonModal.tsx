// src/components/Admin/Modals/ViewPersonModal.tsx
import { type Persona } from '@/components/Admin/peopleTable/peopleTable'
import { formatearFecha, formatearGenero, formatearBautizado, formatearTelefono } from '@/components/Admin/peopleTable/utils/personUtils'
import Modal from '@/components/ui/Modal/Modal'

interface ViewPersonModalProps {
  isOpen: boolean
  onClose: () => void
  persona: Persona | null
}

export default function ViewPersonModal({ isOpen, onClose, persona }: ViewPersonModalProps) {
  if (!persona) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles del Joven" size="md">
      <div className="view-person-content">
        <div className="info-group">
          <label>Nombre completo</label>
          <p>{persona.nombre + ' ' + persona.apellido}</p>
        </div>

        <div className="info-group">
          <label>Cédula</label>
          <p>{persona.cedula}</p>
        </div>

        <div className="info-group">
          <label>Teléfono</label>
          <p>{formatearTelefono(persona.telefono)}</p>
        </div>

        <div className="info-group">
          <label>Email</label>
          <p className="email-wrap">{persona.email || '-'}</p>
        </div>

        <div className="info-row">
          <div className="info-group">
            <label>Fecha de nacimiento</label>
            <p>{formatearFecha(persona.fecha_nacimiento)}</p>
          </div>
          <div className="info-group">
            <label>Edad</label>
            <p>{calcularEdadDesdeFecha(persona.fecha_nacimiento)}</p>
          </div>
        </div>

        <div className="info-row">
          <div className="info-group">
            <label>Género</label>
            <p>{formatearGenero(persona.genero)}</p>
          </div>
          <div className="info-group">
            <label>Bautizado</label>
            <p>{formatearBautizado(persona.bautizado)}</p>
          </div>
        </div>

        {/* Campos de texto libre en fila separada o ancho completo */}
        <div className="info-row">
          <div className="info-group">
            <label>Faltas</label>
            <p style={{ color: (persona.faltas ?? 0) > 2 ? '#dc2626' : '#1f2937', fontWeight: (persona.faltas ?? 0) > 2 ? 700 : 400 }}>
              {persona.faltas ?? 0}
            </p>
          </div>
          <div className="info-group">
            <label>Ministerio</label>
            <p className="text-wrap">{persona.ministerio || '-'}</p>
          </div>
        </div>

        <div className="info-group-full">
          <label>Nivel académico</label>
          <p className="text-wrap">{persona.nivel_academico || '-'}</p>
        </div>

        <div className="info-group-full">
          <label>Ocupación</label>
          <p className="text-wrap">{persona.ocupacion || '-'}</p>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
        </div>
      </div>

      <style>{`
        .view-person-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .info-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-group-full {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-group label, .info-group-full label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-group p, .info-group-full p {
          margin: 0;
          font-size: 0.875rem;
          color: #1f2937;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        /* Para texto largo */
        .text-wrap {
          word-wrap: break-word;
          white-space: normal;
          word-break: break-word;
        }
        /* Para emails */
        .email-wrap {
          word-wrap: break-word;
          word-break: break-all;
        }
        .info-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          margin-top: 8px;
          border-top: 1px solid #e5e7eb;
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

        /* Responsive */
        @media (max-width: 640px) {
          .info-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </Modal>
  )
}

function calcularEdadDesdeFecha(fechaNacimiento?: string): string {
  if (!fechaNacimiento) return '-'
  const birthDate = new Date(fechaNacimiento)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age.toString()
}