import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setError(error.message)
    } else if (data.user) {
      navigate('/dashboard')
    }
    
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      setError(error.message)
    } else {
      setError('Check your email for confirmation link')
    }
    
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000'
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '2rem',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>Login</h1>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            required
          />
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#555' : '#0066cc',
              color: '#fff',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>
        
        <button
          onClick={handleSignUp}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '1rem',
            background: '#555',
            color: '#fff',
            padding: '0.75rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Create Account
        </button>
        
        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#330000',
            color: '#ff9999',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}