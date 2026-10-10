import MeshGradient from "@/components/ui/mesh-gradient"
import VerificationMemberForm from "./verification-member-form"

export default function Page() {
  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 py-28 sm:px-8">
      <MeshGradient
        className="absolute inset-0 -z-10"
        colors={["#0a1a4a", "#1f4fd8", "#4c9bff", "#0a1a4a"]}
        speed={0.35}
        distortion={0.8}
        swirl={0.35}
        scale={1.45}
        rotation={120}
      />

      <div className="relative z-10 w-full max-w-md">
        <VerificationMemberForm />
      </div>
    </section>
  )
}
