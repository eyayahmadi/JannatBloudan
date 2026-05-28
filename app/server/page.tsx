import { redirect } from "next/navigation"

export default function ServerIndexRedirect() {
  redirect("/server/tables")
}
