import { RequireAuth } from "@/components/auth/RequireAuth";

export default function GradeCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-white">{children}</div>
    </RequireAuth>
  );
}
