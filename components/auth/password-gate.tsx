"use client"

import type React from "react"
import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import { getDashboardPassword, setDashboardPassword, clearDashboardPassword } from "@/lib/dashboard-auth"

const SESSION_KEY = "password_authenticated"

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const verifyStored = async () => {
      const stored = getDashboardPassword()
      if (!stored) {
        setIsAuthenticated(false)
        return
      }
      try {
        const res = await fetch("/api/auth/verify", {
          method: "GET",
          headers: { "x-dashboard-password": stored },
          cache: "no-store",
        })
        if (res.ok) {
          if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, "true")
          setIsAuthenticated(true)
        } else {
          clearDashboardPassword()
          if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY)
          setIsAuthenticated(false)
        }
      } catch {
        setIsAuthenticated(false)
      }
    }
    verifyStored()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const res = await fetch("/api/auth/verify", {
        method: "GET",
        headers: { "x-dashboard-password": password },
        cache: "no-store",
      })

      if (res.ok) {
        setDashboardPassword(password)
        if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, "true")
        setIsAuthenticated(true)
        setError("")
      } else {
        setError("Incorrect password. Please try again.")
        setPassword("")
      }
    } catch {
      setError("Unable to verify password. Check your connection and try again.")
    }
  }

  if (isAuthenticated === null) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-display tracking-tight text-foreground">TECH.WISER.</h1>
            <p className="text-muted-foreground">Enter password to access the system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button type="submit" className="w-full">
              Enter
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
