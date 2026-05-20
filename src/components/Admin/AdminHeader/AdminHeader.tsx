// src/components/Admin/AdminHeader/AdminHeader.tsx
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function AdminHeader() {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: '#1f2937' }}>
            Panel de Administración
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Gestiona jóvenes y clases de la iglesia
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.hash = '#/'}
        >
          <Home className="h-4 w-4 mr-2" />
          Volver al Inicio
        </Button>
      </div>
    </div>
  )
}