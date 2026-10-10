import { createClient } from "@/lib/supabase/server"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { CheckCircle2, Clock3, XCircle } from "lucide-react"

import VerificationTable from "./verification-table"

export type VerificationSubmission = {
  id: string
  user_id: string
  amount: number
  status: string
  payment_proof_path: string | null
  payment_proof_url: string | null
  created_at: string

  profile: {
    id: string
    full_name: string | null
    email: string | null
  } | null

  details: {
    full_name: string | null
    title_prefix: string | null
    title_suffix: string | null
    birth_place: string | null
    birth_date: string | null
    gender: string | null
    address: string | null
    province: string | null
    city: string | null
    district: string | null
    postal_code: string | null
    occupation: string | null
    institution_name: string | null
    position: string | null
    education: string | null
    competencies: string | null
    work_experience_years: number | null
    linkedin_url: string | null
    website_url: string | null
  } | null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID").format(Number(amount))
}

export default async function AdminVerificationPage() {
  const supabase = await createClient()

  // =========================================================
  // 1. AMBIL DATA PENGAJUAN VERIFIKASI
  // =========================================================

  const { data: submissions, error: submissionsError } = await supabase
    .from("verification_submissions")
    .select(
      `
      id,
      user_id,
      amount,
      status,
      payment_proof_path,
      created_at
    `
    )
    .order("created_at", {
      ascending: false,
    })

  if (submissionsError) {
    console.error("VERIFICATION ERROR:", {
      message: submissionsError.message,
      code: submissionsError.code,
      details: submissionsError.details,
      hint: submissionsError.hint,
    })

    return (
      <div className="w-full p-6">
        <Card>
          <CardContent className="py-10">
            <p className="text-destructive">Gagal mengambil data verifikasi.</p>

            <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(submissionsError, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =========================================================
  // 2. KUMPULKAN USER ID
  // =========================================================

  const userIds = submissions?.map((submission) => submission.user_id) ?? []

  const uniqueUserIds = [...new Set(userIds)]

  // =========================================================
  // 3. AMBIL DATA PROFILE
  // =========================================================

  const { data: profiles, error: profilesError } =
    uniqueUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select(
            `
            id,
            full_name,
            email
          `
          )
          .in("id", uniqueUserIds)
      : {
          data: [],
          error: null,
        }

  if (profilesError) {
    console.error("PROFILE ERROR:", {
      message: profilesError.message,
      code: profilesError.code,
      details: profilesError.details,
      hint: profilesError.hint,
    })

    return (
      <div className="w-full p-6">
        <Card>
          <CardContent className="py-10">
            <p className="text-destructive">Gagal mengambil data anggota.</p>

            <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(profilesError, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =========================================================
  // 4. AMBIL DATA DETAIL ANGGOTA
  // =========================================================

  const { data: memberDetails, error: memberDetailsError } =
    uniqueUserIds.length > 0
      ? await supabase
          .from("member_details")
          .select(
            `
            user_id,
            full_name,
            title_prefix,
            title_suffix,
            birth_place,
            birth_date,
            gender,
            address,
            province,
            city,
            district,
            postal_code,
            occupation,
            institution_name,
            position,
            education,
            competencies,
            work_experience_years,
            linkedin_url,
            website_url
          `
          )
          .in("user_id", uniqueUserIds)
      : {
          data: [],
          error: null,
        }

  if (memberDetailsError) {
    console.error("MEMBER DETAILS ERROR:", {
      message: memberDetailsError.message,
      code: memberDetailsError.code,
      details: memberDetailsError.details,
      hint: memberDetailsError.hint,
    })

    return (
      <div className="w-full p-6">
        <Card>
          <CardContent className="py-10">
            <p className="text-destructive">
              Gagal mengambil data detail anggota.
            </p>

            <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(memberDetailsError, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =========================================================
  // 5. BUAT MAP PROFILE DAN DETAIL
  // =========================================================

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  )

  const detailsMap = new Map(
    (memberDetails ?? []).map((detail) => [detail.user_id, detail])
  )

  // =========================================================
  // 6. BUAT SIGNED URL BUKTI PEMBAYARAN
  // =========================================================

  const preparedSubmissions = await Promise.all(
    (submissions ?? []).map(async (submission) => {
      let paymentProofUrl: string | null = null

      if (submission.payment_proof_path) {
        console.log("MEMPROSES BUKTI PEMBAYARAN:", {
          submissionId: submission.id,

          userId: submission.user_id,

          path: submission.payment_proof_path,
        })

        // =================================================
        // PENTING
        //
        // Bucket sebenarnya:
        // verification-documents
        //
        // Path object:
        // payment-proofs/{user_id}/{filename}
        // =================================================

        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage
            .from("verification-documents")
            .createSignedUrl(submission.payment_proof_path, 60 * 60)

        // =================================================
        // CEK ERROR
        // =================================================

        if (signedUrlError) {
          console.error("GAGAL MEMBUAT SIGNED URL BUKTI PEMBAYARAN:", {
            submissionId: submission.id,

            bucket: "verification-documents",

            path: submission.payment_proof_path,

            message: signedUrlError.message,

            name: signedUrlError.name,
          })
        } else {
          paymentProofUrl = signedUrlData?.signedUrl ?? null

          console.log("SIGNED URL BUKTI PEMBAYARAN BERHASIL:", {
            submissionId: submission.id,

            bucket: "verification-documents",

            path: submission.payment_proof_path,

            hasUrl: !!paymentProofUrl,
          })
        }
      } else {
        console.warn("BUKTI PEMBAYARAN TIDAK MEMILIKI PATH:", {
          submissionId: submission.id,

          userId: submission.user_id,
        })
      }

      // =================================================
      // RETURN DATA
      // =================================================

      return {
        id: submission.id,

        user_id: submission.user_id,

        amount: Number(submission.amount),

        status: submission.status,

        payment_proof_path: submission.payment_proof_path,

        payment_proof_url: paymentProofUrl,

        created_at: submission.created_at,

        profile: profileMap.get(submission.user_id) ?? null,

        details: detailsMap.get(submission.user_id) ?? null,
      }
    })
  )

  // =========================================================
  // 7. HITUNG STATISTIK
  // =========================================================

  const submittedCount = preparedSubmissions.filter(
    (item) => item.status === "submitted"
  ).length

  const approvedCount = preparedSubmissions.filter(
    (item) => item.status === "approved"
  ).length

  const rejectedCount = preparedSubmissions.filter(
    (item) => item.status === "rejected"
  ).length

  // =========================================================
  // 8. RENDER
  // =========================================================

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Verifikasi Anggota
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Kelola dan verifikasi pengajuan keanggotaan.
        </p>
      </div>

      {/* STATISTICS */}

      <div className="grid gap-4 md:grid-cols-3">
        {/* MENUNGGU */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-medium">
                Menunggu Verifikasi
              </CardTitle>

              <CardDescription className="mt-1">Pengajuan baru</CardDescription>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock3 className="size-4 text-yellow-600" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{submittedCount}</div>
          </CardContent>
        </Card>

        {/* TERVERIFIKASI */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-medium">
                Terverifikasi
              </CardTitle>

              <CardDescription className="mt-1">
                Pengajuan disetujui
              </CardDescription>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="size-4 text-green-600" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        {/* DITOLAK */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-medium">Ditolak</CardTitle>

              <CardDescription className="mt-1">
                Pengajuan ditolak
              </CardDescription>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
              <XCircle className="size-4 text-red-600" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Pengajuan Verifikasi</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Daftar pengajuan verifikasi anggota.
        </p>
      </div>

      <VerificationTable submissions={preparedSubmissions} />
    </div>
  )
}
