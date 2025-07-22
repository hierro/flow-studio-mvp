import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

interface DashboardPageProps {
  user: any
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>Dashboard</h1>
          <button
            onClick={handleLogout}
            style={{
              background: '#cc0000',
              color: '#fff',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        
        <div style={{
          background: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px'
        }}>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1rem' }}>Welcome!</h2>
          <p style={{ color: '#ccc' }}>Email: {user?.email}</p>
          <p style={{ color: '#ccc' }}>ID: {user?.id}</p>
          <p style={{ color: '#00cc00', marginTop: '1rem' }}>✅ Vite + React working fast!</p>
        </div>
      </div>
    </div>
  )
}