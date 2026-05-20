// src/components/Admin/JovenesView/JovenesView.tsx
import PersonaList from '@/components/PersonaList/PersonaList'

export default function JovenesView() {
  return (
    <section style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      width: '100%',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <PersonaList />
    </section>
  )
}