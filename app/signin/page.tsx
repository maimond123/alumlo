'use client'

import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { InlineWidget } from 'react-calendly'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Image from 'next/image' // For Google/Microsoft logos
import { useRouter } from 'next/navigation' // Added for redirection
import { supabase } from '../data/supabase' // Added Supabase client import

export default function SignInPage() {
  const router = useRouter() // Initialize router
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)

  const handleSignUp = async () => {
    setIsLoading(true)
    setError(null)
    console.log("Form data:", { firstName, lastName, email, password })
    // Placeholder: Implement Supabase user creation & email verification
    // e.g., const { error } = await supabase.auth.signUp({ email, password, options: { data: { first_name: firstName, last_name: lastName } } })
    // if (error) setError(error.message) else setShowCalendly(true)
    
    setTimeout(() => {
      setShowCalendly(true)
      setIsLoading(false)
    }, 1000)
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

  const inputClasses = "w-full px-4 py-[11px] border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-[15px]"
  const labelClasses = "block text-[13px] font-medium text-gray-600 mb-1"

  // Styles for the "Verify Email & Schedule Demo" button
  const verifyAndBookButtonClasses = "w-full py-[11px] px-[38px] text-[19px] rounded-full bg-yellow-400/30 text-black border-[3px] border-yellow-500 hover:bg-yellow-400/40 transition-colors duration-300 font-semibold shadow-md shadow-yellow-500/30 hover:shadow-yellow-400/40 flex items-center justify-center"
  
  // Styles for the main "Sign In" button on the form
  const formSignInButtonClasses = "w-full py-[11px] px-[38px] text-[19px] rounded-full bg-emerald-500/30 text-black border-[3px] border-emerald-600 hover:bg-emerald-500/40 transition-colors duration-300 font-semibold shadow-md shadow-emerald-600/30 hover:shadow-emerald-500/40 flex items-center justify-center"
  
  const oAuthButtonClasses = "w-full py-[13px] px-4 rounded-md font-semibold text-[15px] flex items-center justify-center transition-colors duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-black"

  const gradientCenterColor = activeTab === 'signin' 
    ? 'rgba(16, 185, 129, 0.35)'  // Emerald for Sign In
    : 'rgba(250, 204, 21, 0.35)'; // Yellow for Sign Up

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-white"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, ${gradientCenterColor} 0%, rgba(255,255,255,0) 70%)`
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-11 rounded-xl w-full max-w-lg shadow-lg" // Adjusted padding and max-width
      >
        <div className="text-center mb-8">
          <h1 className="text-[42px] font-bold text-black">Alumlo</h1> {/* Adjusted size */}
          <p className="text-gray-500 text-[15px] mt-1">Turn Alumni Data into Action.</p> {/* Adjusted size */}
        </div>

        <div className="space-y-3 mb-6">
          <button onClick={() => handleOAuth('google')} className={oAuthButtonClasses}>
            <Image src="/google-logo.svg" alt="Google" width={19} height={19} className="mr-2.5" /> {/* Adjusted icon size */}
            Continue with Google
          </button>
          <button onClick={() => handleOAuth('microsoft')} className={oAuthButtonClasses}>
            <svg className="mr-2.5" width="19" height="19" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#F35325" d="M1 1h10v10H1z"></path><path fill="#81BC06" d="M12 1h10v10H12z"></path><path fill="#05A6F0" d="M1 12h10v10H1z"></path><path fill="#FFBA08" d="M12 12h10v10H12z"></path></svg> {/* Adjusted icon size */}
            Continue with Microsoft
          </button>
        </div>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-black" />
          <span className="mx-3 text-[13px] text-gray-400 uppercase">OR CONTINUE WITH</span> {/* Adjusted size */}
          <hr className="flex-grow border-t border-black" />
        </div>

        <div className="mb-6 p-1 bg-gray-100 rounded-lg flex border-2 border-black">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-[11px] px-4 rounded-md text-[15px] font-medium transition-colors duration-200 ${
              activeTab === 'signin' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:bg-gray-200/50' // Adjusted size
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-[11px] px-4 rounded-md text-[15px] font-medium transition-colors duration-200 ${
              activeTab === 'signup' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:bg-gray-200/50' // Adjusted size
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
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="johndoe@example.com" required />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className={labelClasses}>Password</label>
              {activeTab === 'signin' && (
                <a href="#" className="text-[13px] text-gray-700 hover:text-black">Forgot password?</a> /* Adjusted size */
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
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />} {/* Adjusted icon size */}
              </button>
            </div>
          </div>
          
          {error && (
            <p className="text-red-500 text-[13px] text-center">{error}</p> /* Adjusted size */
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={activeTab === 'signup' ? verifyAndBookButtonClasses : formSignInButtonClasses}
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-[22px] w-[22px]" /> /* Adjusted icon size */
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
          onClick={() => setShowCalendly(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg w-full max-w-2xl h-[700px] overflow-hidden relative border-2 border-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowCalendly(false)} 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10 p-1 bg-white rounded-full border-2 border-black"
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

