import { StaffTableMenuProvider } from "@/components/menu/staff/StaffTableMenuProvider"

export default function StaffTableMenuLayout({ children }: { children: React.ReactNode }) {
  return <StaffTableMenuProvider>{children}</StaffTableMenuProvider>
}
