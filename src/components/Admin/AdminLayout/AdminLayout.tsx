// src/components/Admin/AdminLayout/AdminLayout.tsx
import { type ReactNode }  from 'react'
interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div style={{ 
      maxWidth: '1400px', 
      width: '100%',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {children}
    </div>
  )
}