"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "null"))
    } catch {}
  }, [])

  function logout() {
    localStorage.removeItem("user")
    setUser(null)
    window.location.href = "/" // return home
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">My Account</h1>
      {!user ? (
        <p className="text-sm text-muted-foreground">Please login or register from the homepage to see your account.</p>
      ) : (
        <div className="grid gap-4">
          <div className="rounded border p-4">
            <div className="text-sm">Name: {user.name}</div>
            <div className="text-sm">Email: {user.email}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
            <Button asChild>
              <a href="/">Continue Shopping</a>
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
