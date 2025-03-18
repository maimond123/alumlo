'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react'
import NetworkVisualization from '../../components/network-visualization-1'
import { useRouter } from 'next/navigation'
import { signInWithEmail } from '../utils/auth'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    setError(null)

    try {
      const user = await signInWithEmail(email, password);
      router.push('/dashboard')

    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        setError('Incorrect email or password')
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please verify your email address')
      } else {
        setError(error.message || 'Failed to sign in')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white relative overflow-hidden">
      <NetworkVisualization fullScreen />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative z-10"
        >
          <Link href="/" className="inline-flex items-center text-emerald-800 hover:text-emerald-600 mb-6">
            <ArrowLeft className="mr-2" size={20} />
            Back to Home
          </Link>
          <h2 className="text-3xl font-bold text-emerald-800 mb-6 text-center">Sign in to AlumIntel</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-emerald-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-emerald-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-500 text-white py-2 rounded-md hover:bg-teal-600 transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          <p className="mt-4 text-sm text-emerald-700 text-center">
            Don't have an account?{' '}
            <Link href="/signup" className="text-teal-500 hover:underline">
              Sign up here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

