'use client'

import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { InlineWidget } from 'react-calendly'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Image from 'next/image' // For Google/Microsoft logos

// Placeholder for Supabase client and auth functions
// import { supabase } from '../utils/supabaseClient'; // Adjust path as needed

export default function SignInPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)

  // Placeholder functions for Supabase interactions
  const handleSignUp = async () => {
    setIsLoading(true)
    setError(null)
    console.log("Form data:", { firstName, lastName, email, password })
    // Placeholder: Implement Supabase user creation & email verification
    // e.g., const { error } = await supabase.auth.signUp({ email, password, options: { data: { first_name: firstName, last_name: lastName } } })
    // if (error) setError(error.message) else setShowCalendly(true)
    
    // For UI testing, directly show Calendly after a short delay
    setTimeout(() => {
      setShowCalendly(true)
      setIsLoading(false)
    }, 1000)
  }

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    // Placeholder: Implement Supabase sign in
    // e.g., const { error } = await supabase.auth.signInWithPassword({ email, password })
    // if (error) setError(error.message) else router.push('/dashboard')
    setTimeout(() => {
      console.log("Signing in with:", email, password)
      setIsLoading(false)
      // router.push('/dashboard'); // Example redirect
    }, 1000)
  }
  
  const handleOAuth = (provider: 'google' | 'microsoft') => {
    console.log(`Continue with ${provider}`)
    // Placeholder: Implement Supabase OAuth
    // e.g., await supabase.auth.signInWithOAuth({ provider })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (activeTab === 'signup') {
      handleSignUp()
    } else {
      handleSignIn()
    }
  }

  const inputClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
  const labelClasses = "block text-xs font-medium text-gray-600 mb-1"
  const buttonBaseClasses = "w-full py-3 px-4 rounded-md font-semibold text-sm flex items-center justify-center transition-colors duration-200"
  const primaryButtonClasses = `${buttonBaseClasses} bg-indigo-700 text-white hover:bg-indigo-800`
  const secondaryButtonClasses = `${buttonBaseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300`

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-white"
      style={{
        backgroundImage: 'radial-gradient(ellipse at center, rgba(250,204,21,0.12) 0%, rgba(255,255,255,0) 60%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-800">Alumlo</h1>
          <p className="text-gray-500 text-sm mt-1">Turn Alumni Data into Action.</p>
        </div>

        <div className="space-y-3 mb-6">
          <button onClick={() => handleOAuth('google')} className={secondaryButtonClasses}>
            <Image src="/google-logo.svg" alt="Google" width={18} height={18} className="mr-2.5" />
            Continue with Google
          </button>
          <button onClick={() => handleOAuth('microsoft')} className={secondaryButtonClasses}>
             {/* You'll need a Microsoft logo SVG, e.g., /microsoft-logo.svg */}
            <svg className="mr-2.5" width="18" height="18" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#F35325" d="M1 1h10v10H1z"></path><path fill="#81BC06" d="M12 1h10v10H12z"></path><path fill="#05A6F0" d="M1 12h10v10H1z"></path><path fill="#FFBA08" d="M12 12h10v10H12z"></path></svg>
            Continue with Microsoft
          </button>
        </div>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="mx-3 text-xs text-gray-400 uppercase">OR CONTINUE WITH</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>

        <div className="mb-6 p-1 bg-gray-100 rounded-lg flex">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'signin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'signup' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'
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
            </>
          )}

          <div>
            <label htmlFor="email" className={labelClasses}>Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="m@example.com" required />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className={labelClasses}>Password</label>
              {activeTab === 'signin' && (
                <a href="#" className="text-xs text-indigo-600 hover:underline">Forgot password?</a>
              )}
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={primaryButtonClasses}
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              activeTab === 'signup' ? 'Verify Email & Schedule Demo' : 'Sign In'
            )}
          </button>
        </form>
      </motion.div>

      {showCalendly && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCalendly(false)} // Close on overlay click
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg w-full max-w-2xl h-[700px] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <button 
              onClick={() => setShowCalendly(false)} 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10 p-1 bg-white rounded-full"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
            <InlineWidget 
              url="https://calendly.com/david-alumlo/alumlo-demo"
              styles={{ height: '100%', width: '100%' }}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

