// src/components/Admin/ClasesView/ClasesView.tsx
import ClaseForm from '@/components/ClassForm/ClassForm'
import ClasesList from '@/components/ClassList/ClassList'

interface ClasesViewProps {
  reloadSignal: number
  onReload: () => void
}

export default function ClasesView({ reloadSignal, onReload }: ClasesViewProps) {
  return (
    <section style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ClaseForm onCreated={onReload} />
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />
        <ClasesList reloadSignal={reloadSignal} />
      </div>
    </section>
  )
}