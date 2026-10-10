import {
  ArrowUpRight,
  BrainCircuit,
  Check,
  Code2,
  Database,
  Eye,
  GitBranch,
  Globe2,
  Layers3,
  MessageSquareText,
  Network,
  ScanEye,
  ShieldCheck,
  Target,
  Workflow,
} from "lucide-react"

const missions = [
  "Membangun komunitas profesional AI yang inklusif.",
  "Mendorong standardisasi kompetensi profesi AI.",
  "Memfasilitasi kolaborasi riset dan industri.",
  "Mempromosikan etika dan tata kelola AI yang bertanggung jawab.",
]

const objectives = [
  "Memberikan pengakuan profesi bagi pengembang AI.",
  "Meningkatkan kapasitas dan kompetensi anggota.",
  "Menjadi rujukan kebijakan AI nasional.",
  "Memperluas jaringan profesional lintas sektor.",
]

const professions = [
  {
    title: "Machine Learning & Deep Learning",
    icon: BrainCircuit,
  },
  {
    title: "Natural Language Processing",
    icon: MessageSquareText,
  },
  {
    title: "Computer Vision",
    icon: ScanEye,
  },
  {
    title: "Robotika & Sistem Otonom",
    icon: Workflow,
  },
  {
    title: "Big Data & Data Science",
    icon: Database,
  },
  {
    title: "AI Ethics & Governance",
    icon: ShieldCheck,
  },
  {
    title: "Reinforcement Learning",
    icon: GitBranch,
  },
  {
    title: "Generative AI & LLM",
    icon: Layers3,
  },
  {
    title: "AI Infrastructure & MLOps",
    icon: Network,
  },
]

export default function TentangAsosiasiPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-linear-to-br from-[#071633] via-[#102b65] to-[#1b3d80]">
        <div className="pointer-events-none absolute -top-32 -right-32 -z-10 size-96 rounded-full bg-blue-400/15 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 pt-32 pb-14 sm:px-8 md:pb-16 lg:px-20">

          <h1 className="mt-4 max-w-3xl text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
            Tentang Asosiasi
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
            Asosiasi Profesi Pengembang Kecerdasan Artifisial Indonesia — wadah
            profesional yang mendedikasikan diri untuk kemajuan ekosistem AI
            nasional.
          </p>
        </div>
      </section>

      {/* SEJARAH ORGANISASI */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-24 lg:px-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="mb-3 text-blue-600 font-mono">
              Tentang Kami
            </p>

            <h2 className="text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl">
              Sejarah Organisasi
            </h2>

            <div className="mt-6 h-1 w-12 rounded-full bg-blue-600" />
          </div>

          <div className="space-y-5 text-sm leading-8 text-slate-600 sm:text-base lg:col-span-8">
            <p>
              ASPROKAINDONESIA didirikan oleh sekelompok akademisi, peneliti,
              dan praktisi kecerdasan artifisial yang memiliki visi bersama
              untuk memajukan ekosistem AI di Indonesia. Berdiri sebagai respons
              terhadap pesatnya perkembangan teknologi kecerdasan artifisial,
              asosiasi ini lahir untuk menjadi wadah profesional yang menaungi
              para pengembang AI di seluruh nusantara.
            </p>

            <p>
              Sejak pendiriannya, ASPROKAINDONESIA terus berupaya mengembangkan
              jaringan profesional lintas sektor industri, akademisi, dan
              pemerintahan. Asosiasi berkomitmen untuk mendukung pertumbuhan
              kompetensi, standardisasi profesi, dan kolaborasi lintas sektor
              dalam bidang kecerdasan artifisial.
            </p>
          </div>
        </div>
      </section>

      {/* VISI MISI TUJUAN */}
      <section className="bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-24 lg:px-20">
          <div className="mb-10">
            <p className="mb-3 text-blue-600 font-mono">
              Arah Organisasi
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Visi, Misi & Tujuan
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* VISI */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-900/5">
              <div className="mb-7 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Eye className="size-6" />
              </div>

              <h3 className="mb-4 text-xl font-semibold text-slate-900">
                Visi
              </h3>

              <p className="text-sm leading-7 text-slate-600">
                Menjadi asosiasi profesi pengembang kecerdasan artifisial
                terdepan di Indonesia yang mendorong inovasi, etika, dan tata
                kelola AI untuk kesejahteraan bangsa.
              </p>
            </div>

            {/* MISI */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-900/5">
              <div className="mb-7 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Target className="size-6" />
              </div>

              <h3 className="mb-4 text-xl font-semibold text-slate-900">
                Misi
              </h3>

              <ul className="space-y-4">
                {missions.map((mission) => (
                  <li
                    key={mission}
                    className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                  >
                    <Check className="mt-1 size-4 shrink-0 text-blue-600" />
                    <span>{mission}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* TUJUAN */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-900/5">
              <div className="mb-7 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Globe2 className="size-6" />
              </div>

              <h3 className="mb-4 text-xl font-semibold text-slate-900">
                Tujuan
              </h3>

              <ul className="space-y-4">
                {objectives.map((objective) => (
                  <li
                    key={objective}
                    className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                  >
                    <Check className="mt-1 size-4 shrink-0 text-blue-600" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* RUANG LINGKUP PROFESI */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-24 lg:px-20">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-blue-600 font-mono">
            Bidang Keahlian
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Ruang Lingkup Profesi
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            ASPROKAINDONESIA mencakup berbagai bidang pengembangan kecerdasan
            artifisial, mulai dari pengembangan model hingga penerapan dan tata
            kelola teknologi AI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {professions.map((profession) => {
            const Icon = profession.icon

            return (
              <div
                key={profession.title}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700">
                  <Icon className="size-5" />
                </div>

                <h3 className="text-sm leading-6 font-medium text-slate-800">
                  {profession.title}
                </h3>

                <ArrowUpRight className="ml-auto size-4 shrink-0 text-slate-300 transition-colors group-hover:text-blue-600" />
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
