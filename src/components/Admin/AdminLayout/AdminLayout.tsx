import { type ReactNode }  from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface AdminLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
}

export default function AdminLayout({ children, sidebar }: AdminLayoutProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div style={{ 
      width: '100%',
      display: 'flex',
      alignItems: 'flex-start',
      paddingLeft: isMobile ? 0 : '250px',
      boxSizing: 'border-box',
      minHeight: '100vh',
    }}>
      {sidebar}
      <main style={{ 
        flex: 1, 
        minWidth: 0, 
        padding: isMobile ? '16px' : '24px 32px',
      }}>
        {children}
      </main>
    </div>
  )
}