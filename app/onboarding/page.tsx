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
      console.log("Token being verified:", token);

      const response = await fetch("/api/verify-token", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ token }),
      })

      console.log("Raw response:", response);
      const data = await response.json()
      console.log("Parsed verification response:", data);
      
      if (!data.valid) {
        throw new Error(data.error || "Invalid token")
      }

      setIsTokenValid(true)
      setEmail(data.email)
    } catch (error) {
      console.error("Full error details:", error)
      setError(error instanceof Error ? error.message : "Token verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

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
        throw new Error("Email not found")
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password
      })

      if (signUpError) throw signUpError

      router.push("/data-insights")
    } catch (error: any) {
      console.error("Signup error:", error)
      setError(error.message || "Failed to complete signup")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">Verifying your account...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">Token Invalid or Expired</h2>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-6">
          <Image src="/assets/icons8-atom-96.png" alt="AlumIntel Logo" width={64} height={64} />
          <h2 className="mt-4 text-2xl font-semibold text-gray-700">Complete Your Account Setup</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  Setting up...
                </>
              ) : (
                "Complete Setup"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

