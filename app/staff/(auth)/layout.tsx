// This layout is for public staff routes (like login)
// It doesn't check authentication - that's handled by middleware
export default function StaffAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


