export default function ParentGradeCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-auto bg-white">{children}</div>
  );
}
