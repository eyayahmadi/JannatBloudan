"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/lib/context/AuthContext"
import { SupabaseAuthUrlListener } from "@/components/supabase-auth-url-listener"
import { RealtimeSyncProvider } from "@/components/realtime/RealtimeSyncProvider"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/i18n/context"
import { MachineTranslateProvider } from "@/lib/i18n/machine-translate"
import { AutoTranslateDom } from "@/lib/i18n/auto-translate-dom"

type ProvidersProps = {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <I18nProvider>
        <MachineTranslateProvider>
          <AuthProvider>
            <SupabaseAuthUrlListener />
            <RealtimeSyncProvider>
              <AutoTranslateDom />
              {children}
            </RealtimeSyncProvider>
          </AuthProvider>
        </MachineTranslateProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
