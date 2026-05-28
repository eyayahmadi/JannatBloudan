import { redirect } from "next/navigation"

export default function KitchenIndexRedirect() {
  redirect("/kitchen/orders")
}
