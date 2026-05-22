// src/components/Admin/Modals/RestorePersonModal.tsx
import { useState } from 'react'
import { type Persona } from '@/components/Admin/peopleTable/peopleTable'
import Modal from '@/components/ui/Modal/Modal'
import { RotateCcw } from 'lucide-react'

interface RestorePersonModalProps {
  isOpen: boolean
  onClose: () => void
  persona: Persona | null
  onConfirm: () => void
}

export default function RestorePersonModal({ isOpen, onClose, persona, onConfirm }: RestorePersonModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Error al restaurar:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!persona) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restaurar Joven" size="sm">
      <div className="restore-person-content">
        <div className="restore-icon">
          <RotateCcw size={48} strokeWidth={1.5} />
        </div>

        <h4>¿Quieres restaurar este registro?</h4>
        <p>
          <strong>{persona.nombre} {persona.apellido}</strong> volverá a aparecer en el listado activo.
        </p>
        <p className="restore-text">
          Esta acción lo quitará de la vista de eliminados.
        </p>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary" type="button" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleConfirm} className="btn-success" type="button" disabled={loading}>
            {loading ? 'Restaurando...' : 'Sí, restaurar'}
          </button>
        </div>
      </div>

      <style>{`
        .restore-person-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }
        .restore-icon {
          color: #16a34a;
          background: #f0fdf4;
          padding: 16px;
          border-radius: 50%;
          display: inline-flex;
        }
        h4 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }
        p {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
        }
        .restore-text {
          color: #15803d;
          font-size: 0.75rem;
        }
        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          padding-top: 16px;
          margin-top: 8px;
          width: 100%;
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
        .btn-success {
          padding: 8px 20px;
          background: #16a34a;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
        }
        .btn-success:hover:not(:disabled) {
          background: #15803d;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </Modal>
  )
}