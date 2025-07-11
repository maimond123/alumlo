'use client'

import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { InlineWidget } from 'react-calendly'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '../data/supabase'

export default function SignInPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [organization, setOrganization] = useState('')
  const [role, setRole] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)

  const handleSignUp = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Insert demo request data into Supabase
      const { error } = await supabase
        .from('demo_requests')
        .insert([
          {
            full_name: `${firstName} ${lastName}`,
            email: email,
            organization: organization,
            role: role
          }
        ])
      
      if (error) {
        setError(error.message)
      } else {
        // Show Calendly widget for scheduling demo after successful data insertion
        setShowCalendly(true)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else if (signInError.message.includes("Email not confirmed")) {
           setError("Please verify your email before signing in.");
        }
        else {
          setError(signInError.message || "Failed to sign in. Please try again.");
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (activeTab === 'signup') {
      handleSignUp()
    } else {
      handleSignIn()
    }
  }

  const inputClasses = "w-full px-4 py-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-[15px]"
  const labelClasses = "block text-[13px] font-medium text-gray-600 mb-1"

  // Styles for the "Schedule Demo" button
  const scheduleDemoButtonClasses = "w-full py-[11px] px-[38px] text-[19px] rounded-full bg-yellow-400/30 text-black border border-gray-300 hover:bg-yellow-400/40 transition-colors duration-300 font-semibold shadow-md shadow-yellow-500/30 hover:shadow-yellow-400/40 flex items-center justify-center"
  
  // Styles for the main "Sign In" button on the form
  const formSignInButtonClasses = "w-full py-[11px] px-[38px] text-[19px] rounded-full bg-emerald-500/30 text-black border border-gray-300 hover:bg-emerald-500/40 transition-colors duration-300 font-semibold shadow-md shadow-emerald-600/30 hover:shadow-emerald-500/40 flex items-center justify-center"

  const gradientCenterColor = activeTab === 'signin' 
    ? 'rgba(16, 185, 129, 0.35)'  // Emerald for Sign In
    : 'rgba(250, 204, 21, 0.35)'; // Yellow for Sign Up

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-white/20 backdrop-blur-xl"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, ${gradientCenterColor} 0%, rgba(255,255,255,0) 70%)`
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-11 rounded-xl w-full max-w-lg shadow-lg border border-gray-300"
      >
        <div className="text-center mb-8">
          <h1 className="text-[42px] font-bold text-black">Alumlo</h1>
          <p className="text-gray-500 text-[15px] mt-1">Turn Alumni Data into Action.</p>
        </div>

        <div className="mb-6 p-1 bg-gray-100 rounded-lg flex border border-gray-300">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-[11px] px-4 rounded-md text-[15px] font-medium transition-colors duration-200 ${
              activeTab === 'signin' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-[11px] px-4 rounded-md text-[15px] font-medium transition-colors duration-200 ${
              activeTab === 'signup' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'signup' && (
            <>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label htmlFor="firstName" className={labelClasses}>First name</label>
                  <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClasses} required />
                </div>
                <div className="flex-1">
                  <label htmlFor="lastName" className={labelClasses}>Last name</label>
                  <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClasses} required />
                </div>
              </div>
              <div>
                <label htmlFor="email" className={labelClasses}>Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="johndoe@example.com" required />
              </div>
              <div>
                <label htmlFor="organization" className={labelClasses}>Organization</label>
                <input type="text" id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} className={inputClasses} required />
              </div>
              <div>
                <label htmlFor="role" className={labelClasses}>Role</label>
                <input type="text" id="role" value={role} onChange={(e) => setRole(e.target.value)} className={inputClasses} required />
              </div>
            </>
          )}

          {activeTab === 'signin' && (
            <>
              <div>
                <label htmlFor="email" className={labelClasses}>Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="johndoe@example.com" required />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className={labelClasses}>Password</label>
                  <a href="#" className="text-[13px] text-gray-700 hover:text-black">Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClasses}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </>
          )}
          
          {error && (
            <p className="text-red-500 text-[13px] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={activeTab === 'signup' ? scheduleDemoButtonClasses : formSignInButtonClasses}
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-[22px] w-[22px]" />
            ) : (
              activeTab === 'signup' ? 'Schedule Demo' : 'Sign In'
            )}
          </button>
        </form>
      </motion.div>

      {showCalendly && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowCalendly(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/30 backdrop-blur-xl rounded-lg w-full max-w-2xl h-[700px] overflow-hidden relative border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowCalendly(false)} 
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 z-10 p-1 bg-white/50 backdrop-blur-sm rounded-full border border-white/30"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
            <InlineWidget 
              url="https://calendly.com/david-alumlo/30min"
              styles={{ height: '100%', width: '100%' }}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

