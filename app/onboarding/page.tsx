// app/onboarding/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, XCircle, Eye, EyeOff } from "lucide-react"
import { supabase } from "../data/supabase"
import Image from "next/image"
import type React from "react"

export default function Onboarding() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      verifyToken(token)
    } else {
      setIsVerifying(false)
      setError("No token provided")
    }
  }, [searchParams])

  const verifyToken = async (token: string) => {
    try {
      // Call our API route to verify the token
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setIsTokenValid(true);
        setEmail(data.email);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      setError(error instanceof Error ? error.message : "Token verification failed");
      setIsTokenValid(false);
    } finally {
      setIsVerifying(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsSubmitting(false)
      return
    }

    try {
      if (!email) {
        throw new Error("Email not found");
      }
      
      if (!showConfirmation) {
        // Step 1: Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (error) throw error;
        
        // Check if email confirmation is required
        // Supabase might not require confirmation if we've pre-verified the email
        if (data?.user?.identities?.length === 0 || 
            data?.user?.identities?.[0]?.identity_data?.email_verified === false) {
          setShowConfirmation(true);
        } else {
          // If email is already verified, sign in directly
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
          });
          
          if (signInError) throw signInError;
          
          // Update user status in database
          await supabase
            .from('customer_information')
            .update({ account_status: 'active' })
            .eq('school_email', email);
            
          router.push('/dashboard');
        }
      } else {
        // Step 2: Confirm signup with the code
        const { error } = await supabase.auth.verifyOtp({
          email: email,
          token: confirmationCode,
          type: 'signup'
        });

        if (error) throw error;
        
        // Update user status in database
        await supabase
          .from('customer_information')
          .update({ account_status: 'active' })
          .eq('school_email', email);
          
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "An error occurred during signup");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-emerald-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verifying Link</h2>
            <p className="mt-2 text-sm text-gray-600">Please wait while we verify your link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Invalid Link</h2>
            <p className="mt-2 text-sm text-gray-600">
              {error || "This link is invalid or has expired. Please request a new one."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow"
      >
        <div className="text-center">
          <Image
            src="/logos/logo.svg"
            alt="AlumIntel Logo"
            width={150}
            height={50}
            className="mx-auto"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {showConfirmation ? "Confirm Your Account" : "Complete Your Account Setup"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {showConfirmation
              ? "A verification code has been sent to your email. Please enter it below."
              : "Create a password to access your AlumIntel dashboard."}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email || ""}
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {!showConfirmation ? (
            <>
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Create Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-[2.1rem] right-0 pr-3 flex items-center text-sm leading-5"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>

              <div className="relative">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute top-[2.1rem] right-0 pr-3 flex items-center text-sm leading-5"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-700">
                Confirmation Code
              </label>
              <input
                type="text"
                id="confirmationCode"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                required
                placeholder="Enter the code sent to your email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  {showConfirmation ? "Confirming..." : "Setting up..."}
                </>
              ) : (
                showConfirmation ? "Confirm Account" : "Complete Setup"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}