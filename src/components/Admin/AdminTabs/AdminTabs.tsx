// src/components/Admin/AdminTabs/AdminTabs.tsx
import { TrendingUp, Users, GraduationCap } from 'lucide-react'

interface AdminTabsProps {
  currentSection: string
  secretHash: string
}

export default function AdminTabs({ currentSection, secretHash }: AdminTabsProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, path: 'dashboard' },
    { id: 'jovenes', label: 'Jóvenes', icon: Users, path: 'jovenes' },
    { id: 'clases', label: 'Clases', icon: GraduationCap, path: 'clases' }
  ]

  return (
    <nav style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '8px',
      marginBottom: '24px',
      display: 'flex',
      gap: '8px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      {tabs.map(tab => (
        <a
          key={tab.id}
          href={`${secretHash}/${tab.path}`}
          style={{
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.15s',
            backgroundColor: currentSection === tab.id ? '#dbeafe' : 'transparent',
            color: currentSection === tab.id ? '#1e40af' : '#6b7280'
          }}
          onMouseEnter={(e) => {
            if (currentSection !== tab.id) {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
            }
          }}
          onMouseLeave={(e) => {
            if (currentSection !== tab.id) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </a>
      ))}
    </nav>
  )
}