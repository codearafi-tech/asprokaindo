"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Images, Plus, Search, Loader2, X } from "lucide-react"

import { GalleryActivityDialog } from "./gallery-activity-dialog"

import {
  GalleryActivityForm,
  type ActivityStatus,
  type GalleryPhoto,
  type SelectedGalleryPhoto,
} from "./gallery-activity-form"

import {
  GalleryActivityCard,
  type GalleryActivity,
} from "./gallery-activity-card"

const BUCKET = "gallery-images"
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_PHOTOS = 30

type StatusFilter = "all" | ActivityStatus

function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Terjadi kesalahan. Silakan coba lagi."
}

export default function AdminGaleriPage() {
  const supabase = React.useMemo(() => createClient(), [])

  const [activities, setActivities] = React.useState<GalleryActivity[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")

  const [showForm, setShowForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [activityToDelete, setActivityToDelete] =
    React.useState<GalleryActivity | null>(null)

  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [activityDate, setActivityDate] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [status, setStatus] = React.useState<ActivityStatus>("draft")

  const [existingPhotos, setExistingPhotos] = React.useState<GalleryPhoto[]>([])
  const [selectedPhotos, setSelectedPhotos] = React.useState<
    SelectedGalleryPhoto[]
  >([])
  const [coverPhoto, setCoverPhoto] = React.useState("")
  const [removedPhotoIds, setRemovedPhotoIds] = React.useState<string[]>([])

  const getPublicUrl = React.useCallback(
    (path: string | null) => {
      if (!path) return ""

      if (path.startsWith("http://") || path.startsWith("https://")) {
        return path
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      return data.publicUrl
    },
    [supabase]
  )

  const loadActivities = React.useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const { data, error: queryError } = await supabase
        .from("gallery_activities")
        .select(
          `
          id,
          title,
          slug,
          description,
          activity_date,
          location,
          cover_image_path,
          status,
          created_at,
          gallery_photos (
            id,
            activity_id,
            image_path,
            caption,
            display_order
          )
        `
        )
        .order("activity_date", { ascending: false })

      if (queryError) throw queryError

      const rows = (data ?? []) as unknown as GalleryActivity[]

      rows.forEach((activity) => {
        activity.gallery_photos ??= []
        activity.gallery_photos.sort(
          (a, b) => a.display_order - b.display_order
        )
      })

      setActivities(rows)
    } catch (err) {
      setError(`Gagal memuat data galeri: ${getErrorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    void loadActivities()
  }, [loadActivities])

  const clearSelectedPhotos = React.useCallback(() => {
    selectedPhotos.forEach((photo) => {
      URL.revokeObjectURL(photo.preview)
    })

    setSelectedPhotos([])
  }, [selectedPhotos])

  const resetForm = React.useCallback(() => {
    clearSelectedPhotos()

    setTitle("")
    setDescription("")
    setActivityDate("")
    setLocation("")
    setStatus("draft")

    setExistingPhotos([])
    setCoverPhoto("")
    setRemovedPhotoIds([])
    setEditingId(null)
    setShowForm(false)
    setError("")
  }, [clearSelectedPhotos])

  const openCreateForm = () => {
    resetForm()
    setSuccess("")
    setShowForm(true)
  }

  const openEditForm = (activity: GalleryActivity) => {
    clearSelectedPhotos()

    setEditingId(activity.id)
    setTitle(activity.title)
    setDescription(activity.description ?? "")
    setActivityDate(activity.activity_date.slice(0, 10))
    setLocation(activity.location ?? "")
    setStatus(activity.status)
    setExistingPhotos(activity.gallery_photos ?? [])

    const cover = activity.gallery_photos?.find(
      (photo) => photo.image_path === activity.cover_image_path
    )

    setCoverPhoto(cover ? `existing:${cover.id}` : "")
    setRemovedPhotoIds([])
    setError("")
    setSuccess("")
    setShowForm(true)
  }

  // Validasi dan siapkan foto baru.
  const handleFileChange = (files: FileList | null) => {
    if (!files) return

    setError("")

    const incoming = Array.from(files)
    const remainingExisting = existingPhotos.filter(
      (photo) => !removedPhotoIds.includes(photo.id)
    )

    const remainingSlots =
      MAX_PHOTOS - remainingExisting.length - selectedPhotos.length

    if (remainingSlots <= 0) {
      setError(`Maksimal ${MAX_PHOTOS} foto per kegiatan.`)
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of incoming) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        errors.push(`${file.name}: gunakan JPG, PNG, atau WebP.`)
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ukuran maksimal 5 MB.`)
        continue
      }

      if (validFiles.length < remainingSlots) {
        validFiles.push(file)
      } else {
        errors.push(`Maksimal ${MAX_PHOTOS} foto per kegiatan.`)
      }
    }

    const newPhotos: SelectedGalleryPhoto[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      key: crypto.randomUUID(),
    }))

    setSelectedPhotos((previous) => [...previous, ...newPhotos])

    if (!coverPhoto && newPhotos.length > 0) {
      setCoverPhoto(newPhotos[0].key)
    }

    if (errors.length > 0) {
      setError(errors.join(" "))
    }
  }

  const removeNewPhoto = (photo: SelectedGalleryPhoto) => {
    if (coverPhoto === photo.key) {
      setCoverPhoto("")
    }

    URL.revokeObjectURL(photo.preview)

    setSelectedPhotos((previous) =>
      previous.filter((item) => item.key !== photo.key)
    )
  }

  const removeExistingPhoto = (photo: GalleryPhoto) => {
    setRemovedPhotoIds((previous) =>
      previous.includes(photo.id) ? previous : [...previous, photo.id]
    )

    if (coverPhoto === `existing:${photo.id}`) {
      setCoverPhoto("")
    }
  }

  // Simpan kegiatan, foto, dan sampul.
  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (!title.trim() || !activityDate) {
      setError("Judul dan tanggal kegiatan wajib diisi.")
      return
    }

    const remainingExisting = existingPhotos.filter(
      (photo) => !removedPhotoIds.includes(photo.id)
    )

    const totalPhotos = remainingExisting.length + selectedPhotos.length

    if (totalPhotos === 0) {
      setError("Tambahkan minimal satu foto kegiatan.")
      return
    }

    if (totalPhotos > MAX_PHOTOS) {
      setError(`Maksimal ${MAX_PHOTOS} foto per kegiatan.`)
      return
    }

    setSaving(true)

    const uploadedPaths: string[] = []
    let createdActivityId: string | null = null

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error("Sesi login tidak ditemukan.")

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError

      if (profile?.role !== "admin") {
        throw new Error("Hanya admin yang dapat mengelola galeri.")
      }

      const baseSlug = createSlug(title)

      if (!baseSlug) {
        throw new Error("Judul kegiatan tidak valid.")
      }

      let slug = baseSlug

      if (editingId) {
        const { data: duplicateSlug, error: slugError } = await supabase
          .from("gallery_activities")
          .select("id")
          .eq("slug", baseSlug)
          .neq("id", editingId)
          .maybeSingle()

        if (slugError) throw slugError

        slug = duplicateSlug ? `${baseSlug}-${editingId.slice(0, 8)}` : baseSlug
      } else {
        slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
      }

      const activityPayload = {
        title: title.trim(),
        slug,
        description: description.trim() || null,
        activity_date: activityDate,
        location: location.trim() || null,
        status,
      }

      let activityId = editingId

      if (editingId) {
        const { error: updateError } = await supabase
          .from("gallery_activities")
          .update(activityPayload)
          .eq("id", editingId)

        if (updateError) throw updateError
      } else {
        const { data: created, error: insertError } = await supabase
          .from("gallery_activities")
          .insert({
            ...activityPayload,
            created_by: user.id,
          })
          .select("id")
          .single()

        if (insertError) throw insertError

        activityId = created.id
        createdActivityId = created.id
      }

      if (!activityId) {
        throw new Error("ID kegiatan tidak ditemukan.")
      }

      // Upload foto baru ke Storage.
      // ID metadata foto dibiarkan dibuat otomatis oleh database.
      const uploadedPhotos: Omit<GalleryPhoto, "id">[] = []

      for (const [index, photo] of selectedPhotos.entries()) {
        const extension =
          photo.file.name.split(".").pop()?.toLowerCase() || "jpg"

        const path = `${activityId}/${crypto.randomUUID()}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, photo.file, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.file.type,
          })

        if (uploadError) throw uploadError

        uploadedPaths.push(path)

        uploadedPhotos.push({
          activity_id: activityId,
          image_path: path,
          caption: null,
          display_order: remainingExisting.length + index,
        })
      }

      // Simpan metadata foto.
      if (uploadedPhotos.length > 0) {
        const { error: photoInsertError } = await supabase
          .from("gallery_photos")
          .insert(uploadedPhotos)

        if (photoInsertError) throw photoInsertError
      }

      // Tentukan foto sampul.
      const selectedExistingCover = remainingExisting.find(
        (photo) => coverPhoto === `existing:${photo.id}`
      )

      const selectedNewCoverIndex = selectedPhotos.findIndex(
        (photo) => photo.key === coverPhoto
      )

      let coverPath = ""

      if (selectedExistingCover) {
        coverPath = selectedExistingCover.image_path
      } else if (selectedNewCoverIndex >= 0) {
        coverPath = uploadedPhotos[selectedNewCoverIndex]?.image_path ?? ""
      }

      if (!coverPath) {
        coverPath =
          remainingExisting[0]?.image_path ??
          uploadedPhotos[0]?.image_path ??
          ""
      }

      if (!coverPath) {
        throw new Error("Foto sampul kegiatan tidak ditemukan.")
      }

      const { error: coverError } = await supabase
        .from("gallery_activities")
        .update({ cover_image_path: coverPath })
        .eq("id", activityId)

      if (coverError) throw coverError

      // Hapus metadata foto lama yang dipilih untuk dihapus.
      const photosToRemove = existingPhotos.filter((photo) =>
        removedPhotoIds.includes(photo.id)
      )

      if (photosToRemove.length > 0) {
        const { error: deleteRowsError } = await supabase
          .from("gallery_photos")
          .delete()
          .in(
            "id",
            photosToRemove.map((photo) => photo.id)
          )
          .eq("activity_id", activityId)

        if (deleteRowsError) throw deleteRowsError
      }

      // Hapus file Storage untuk foto lama.
      const removedPaths = photosToRemove.map((photo) => photo.image_path)

      if (removedPaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove(removedPaths)

        if (storageError) {
          console.error(
            "Data foto sudah diperbarui, tetapi file lama gagal dihapus:",
            storageError
          )
        }
      }

      clearSelectedPhotos()
      setExistingPhotos([])
      setRemovedPhotoIds([])
      setEditingId(null)
      setShowForm(false)

      setSuccess(
        status === "published"
          ? "Kegiatan berhasil dipublikasikan."
          : "Kegiatan berhasil disimpan sebagai draft."
      )

      await loadActivities()
    } catch (err) {
      console.error("Gagal menyimpan galeri:", err)

      // Bersihkan file upload baru jika penyimpanan gagal.
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from(BUCKET)
          .remove(uploadedPaths)

        if (cleanupError) {
          console.error("Gagal membersihkan file upload:", cleanupError)
        }
      }

      // Hapus record kegiatan baru jika proses pembuatan gagal.
      if (createdActivityId) {
        const { error: cleanupActivityError } = await supabase
          .from("gallery_activities")
          .delete()
          .eq("id", createdActivityId)

        if (cleanupActivityError) {
          console.error(
            "Gagal membersihkan data kegiatan:",
            cleanupActivityError
          )
        }
      }

      setError(`Gagal menyimpan kegiatan: ${getErrorMessage(err)}`)
    } finally {
      setSaving(false)
    }
  }

  // Hapus kegiatan melalui dialog konfirmasi shadcn.
  const handleDelete = async () => {
    if (!activityToDelete || deleting) return

    const activity = activityToDelete

    setError("")
    setSuccess("")
    setDeleting(true)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) throw new Error("Silakan login kembali.")

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError

      if (profile?.role !== "admin") {
        throw new Error("Hanya admin yang dapat menghapus kegiatan.")
      }

      const { data: photos, error: photosError } = await supabase
        .from("gallery_photos")
        .select("image_path")
        .eq("activity_id", activity.id)

      if (photosError) throw photosError

      const photoPaths = (photos ?? []).map(
        (photo: { image_path: string }) => photo.image_path
      )

      const { error: deleteError } = await supabase
        .from("gallery_activities")
        .delete()
        .eq("id", activity.id)

      if (deleteError) throw deleteError

      setActivityToDelete(null)

      if (photoPaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove(photoPaths)

        if (storageError) {
          console.error(
            "Kegiatan terhapus, tetapi beberapa file gagal dihapus:",
            storageError
          )

          setSuccess(
            "Kegiatan berhasil dihapus, tetapi sebagian file foto gagal dihapus."
          )
        } else {
          setSuccess("Kegiatan berhasil dihapus.")
        }
      } else {
        setSuccess("Kegiatan berhasil dihapus.")
      }

      await loadActivities()
    } catch (err) {
      setError(`Gagal menghapus kegiatan: ${getErrorMessage(err)}`)
    } finally {
      setDeleting(false)
    }
  }

  // Filter daftar kegiatan.
  const filteredActivities = activities.filter((activity) => {
    const keyword = search.trim().toLowerCase()

    const matchesSearch =
      activity.title.toLowerCase().includes(keyword) ||
      (activity.location ?? "").toLowerCase().includes(keyword) ||
      (activity.description ?? "").toLowerCase().includes(keyword)

    const matchesStatus =
      statusFilter === "all" || activity.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const publishedCount = activities.filter(
    (activity) => activity.status === "published"
  ).length

  const draftCount = activities.filter(
    (activity) => activity.status === "draft"
  ).length

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Galeri Kegiatan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola dokumentasi foto kegiatan ASPROKAINDO.
          </p>
        </div>

        <Button onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Tambah Kegiatan
        </Button>
      </div>

      {/* Notifikasi */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setError("")}
            aria-label="Tutup pesan error"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <span>{success}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSuccess("")}
            aria-label="Tutup pesan sukses"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialog tambah/edit */}
      <GalleryActivityDialog
        open={showForm}
        onOpenChange={(open) => {
          if (saving) return

          if (!open) {
            resetForm()
            return
          }

          setShowForm(true)
        }}
        editing={Boolean(editingId)}
        saving={saving}
      >
        <GalleryActivityForm
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          activityDate={activityDate}
          setActivityDate={setActivityDate}
          location={location}
          setLocation={setLocation}
          status={status}
          setStatus={setStatus}
          existingPhotos={existingPhotos}
          selectedPhotos={selectedPhotos}
          coverPhoto={coverPhoto}
          setCoverPhoto={setCoverPhoto}
          removedPhotoIds={removedPhotoIds}
          onFileChange={handleFileChange}
          onRemoveNewPhoto={removeNewPhoto}
          onRemoveExistingPhoto={removeExistingPhoto}
          onSubmit={handleSave}
          onCancel={resetForm}
          saving={saving}
          getPublicUrl={getPublicUrl}
        />
      </GalleryActivityDialog>

      {/* Dialog konfirmasi hapus */}
      <AlertDialog
        open={Boolean(activityToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setActivityToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kegiatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Kegiatan{" "}
              <span className="font-medium text-foreground">
                {activityToDelete?.title}
              </span>{" "}
              beserta seluruh dokumentasi fotonya akan dihapus. Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>

            <AlertDialogAction
              disabled={deleting}
              className="text-destructive-foreground bg-red-600
               hover:bg-red-500/90"
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Statistik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Kegiatan</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {activities.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Dipublikasikan</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {publishedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Draft</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{draftCount}</p>
        </div>
      </div>

      {/* Daftar kegiatan */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Daftar Kegiatan</h2>
            <p className="mt-1 text-xs text-slate-500">
              Cari, edit, dan kelola dokumentasi kegiatan.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 sm:w-60"
                placeholder="Cari kegiatan..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              aria-label="Filter status"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm sm:w-48"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="all">Semua status</option>
              <option value="published">Dipublikasikan</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memuat data galeri...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-400">
              <Images className="h-8 w-8" />
            </div>

            <h3 className="font-semibold text-slate-800">
              {activities.length === 0
                ? "Belum ada kegiatan"
                : "Kegiatan tidak ditemukan"}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {activities.length === 0
                ? "Tambahkan dokumentasi kegiatan pertama untuk ditampilkan di sini."
                : "Coba ubah kata kunci pencarian atau filter status."}
            </p>

            {activities.length === 0 && (
              <Button className="mt-4" onClick={openCreateForm}>
                <Plus className="h-4 w-4" />
                Tambah Kegiatan
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredActivities.map((activity) => (
              <GalleryActivityCard
                key={activity.id}
                activity={activity}
                getPublicUrl={getPublicUrl}
                onEdit={openEditForm}
                onDelete={(item) => setActivityToDelete(item)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
