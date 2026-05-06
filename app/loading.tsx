import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"
import { SITE } from "@/lib/site-config"

export default function GlobalLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center mesh-page-bg overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 45% at 50% 30%, rgba(201, 162, 76, 0.18) 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-[1] flex flex-col items-center gap-6">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl shadow-[0_18px_48px_-20px_rgba(201,162,76,0.45)] ring-2 ring-[color:var(--lux-gold)]/40">
          <span
            aria-hidden
            className="absolute inset-0 rounded-3xl"
            style={{ background: "var(--lux-gradient-ink)" }}
          />
          <div className="relative breathe">
            <BloudanLogoMark withPhotoBack />
          </div>
          <span className="aurora-ring" aria-hidden />
        </div>

        <div className="text-center">
          <p className="font-display text-xl font-semibold text-amber-950">
            {SITE.name}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-amber-800/70">
            Chargement…
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-[color:var(--lux-gold)]"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-[color:var(--lux-bordeaux)]"
            style={{ animationDelay: "120ms" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-[color:var(--lux-olive)]"
            style={{ animationDelay: "240ms" }}
          />
        </div>
      </div>
    </div>
  )
}
