import { RequireAuth } from "@/components/auth/RequireAuth";

export default function GradeCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="h-screen overflow-hidden bg-white">{children}</div>
    </RequireAuth>
  );
}
