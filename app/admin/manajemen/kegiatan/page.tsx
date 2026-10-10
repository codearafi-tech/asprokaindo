
import { createClient } from "@/lib/supabase/server"

import { Card, CardContent } from "@/components/ui/card"

import { ActivityTable } from "./activity-table"
import { ActivityCreateButton } from "./activity-create-button"

export type Activity = {
  id: string
  title: string
  type: "training" | "workshop" | "webinar"
  status: "draft" | "published" | "completed" | "cancelled"

  description: string | null

  start_at: string
  end_at: string

  registration_start_at: string | null
  registration_end_at: string | null

  location_type: "offline" | "online" | "hybrid"

  location: string | null
  zoom_url: string | null

  organizer: string
  certificate_title: string

  // Biaya pendaftaran
  is_paid: boolean
  registration_fee: number

  image_path: string | null
  flyer_url: string | null

  created_at: string
}

export default async function KegiatanPage() {
  const supabase = await createClient()

  // ==========================================
  // AMBIL DATA KEGIATAN
  // ==========================================

  const { data: activities, error } = await supabase
    .from("activities")
    .select(`
      id,
      title,
      type,
      status,
      description,
      start_at,
      end_at,
      registration_start_at,
      registration_end_at,
      location_type,
      location,
      organizer,
      certificate_title,
      is_paid,
      registration_fee,
      image_path,
      created_at
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Gagal mengambil data kegiatan:", error)
  }

  const activityList = activities ?? []
  const activityIds = activityList.map((activity) => activity.id)

  // ==========================================
  // AMBIL LINK ZOOM DARI TABEL KHUSUS
  // ==========================================

  const { data: accessLinks, error: accessLinksError } =
    activityIds.length > 0
      ? await supabase
          .from("activity_access_links")
          .select("activity_id, zoom_url")
          .in("activity_id", activityIds)
      : { data: [], error: null }

  if (accessLinksError) {
    console.error(
      "Gagal mengambil link akses kegiatan:",
      accessLinksError
    )
  }

  const zoomUrlMap = new Map(
    (accessLinks ?? []).map((link) => [
      link.activity_id,
      link.zoom_url,
    ])
  )

  // ==========================================
  // BUAT SIGNED URL FLYER
  // Bucket activity-flyers tetap private.
  // ==========================================

  const activitiesWithFlyer: Activity[] = await Promise.all(
    activityList.map(async (activity) => {
      let flyerUrl: string | null = null

      if (activity.image_path) {
        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage
            .from("activity-flyers")
            .createSignedUrl(activity.image_path, 60 * 60)

        if (signedUrlError) {
          console.error(
            `Gagal membuat signed URL flyer untuk kegiatan ${activity.id}:`,
            signedUrlError
          )
        } else {
          flyerUrl = signedUrlData?.signedUrl ?? null
        }
      }

      return {
        ...activity,
        zoom_url: zoomUrlMap.get(activity.id) ?? null,
        flyer_url: flyerUrl,
      }
    })
  )

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Manajemen Kegiatan
          </h1>

          <p className="text-sm text-muted-foreground">
            Kelola pelatihan, workshop, dan webinar organisasi.
          </p>
        </div>

        <ActivityCreateButton />
      </div>

      {/* CONTENT */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardContent className="p-0">
          <ActivityTable activities={activitiesWithFlyer} />
        </CardContent>
      </Card>
    </div>
  )
}
