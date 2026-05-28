// src/components/Admin/Modals/DeletePersonModal.tsx
import { useState } from 'react'
import { type Persona } from '@/components/Admin/peopleTable/types'
import Modal from '@/components/ui/Modal/Modal'
import { AlertTriangle } from 'lucide-react'

interface DeletePersonModalProps {
  isOpen: boolean
  onClose: () => void
  persona: Persona | null
  onConfirm: () => void
}

export default function DeletePersonModal({ isOpen, onClose, persona, onConfirm }: DeletePersonModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Error al eliminar:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!persona) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar Joven" size="sm">
      <div className="delete-person-content">
        <div className="warning-icon">
          <AlertTriangle size={48} strokeWidth={1.5} />
        </div>
        
        <h4>¿Estás seguro de mover este registro a eliminados?</h4>
        <p>
          Esta acción eliminará a <strong>{persona.nombre} {persona.apellido}</strong> del listado activo.
        </p>
        <p className="warning-text">
          Podrás restaurarlo contactando al equipo de soporte.
        </p>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary" type="button" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleConfirm} className="btn-danger" type="button" disabled={loading}>
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>

      <style>{`
        .delete-person-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }
        .warning-icon {
          color: #ef4444;
          background: #fef2f2;
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
        .warning-text {
          color: #b45309;
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
        .btn-danger {
          padding: 8px 20px;
          background: #dc2626;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
        }
        .btn-danger:hover:not(:disabled) {
          background: #b91c1c;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </Modal>
  )
}