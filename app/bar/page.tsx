import { redirect } from "next/navigation"

export default function BarIndexRedirect() {
  redirect("/bar/orders")
}
