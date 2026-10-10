"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { FcGoogle } from "react-icons/fc"
import Link from "next/link"

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleRegister = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Setelah login/register sukses, arahkan ke callback untuk diproses
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      console.error("Gagal daftar dengan Google:", error.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-lg text-center shadow-md p-12">
        <CardHeader className="space-y-1">
             <img src="/Asproka-logo.jpeg" alt="Asproka Logo" className="w-42 mx-auto" />
          <CardTitle className="text-2xl font-semibold mt-4">
            Daftar Anggota Asosiasi
          </CardTitle>
          <CardDescription>
            Daftar secara instan menggunakan akun Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            type="button"
            className="flex w-full items-center justify-center gap-2 py-6 text-base font-medium"
            onClick={handleGoogleRegister}
            disabled={loading}
          >
            <FcGoogle />
            {loading ? "Memproses..." : "Daftar dengan Google"}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center space-y-2 text-sm text-muted-foreground">
          <div>
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline hover:text-primary/80"
            >
              Masuk di sini
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
