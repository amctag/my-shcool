import { redirect } from "next/navigation";

export default function GradesPage() {
  redirect("/grades/by-course");
}
