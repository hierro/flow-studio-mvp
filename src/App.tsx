import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import { supabase } from './lib/supabase'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="app-loading">
        Loading...
      </div>
    )
  }

  return (
    <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={user ? <DashboardPage user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/project/:id"
          element={user ? <ProjectDetailPage user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
  )
}