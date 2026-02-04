export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        body {
          overflow: hidden;
        }
      `}</style>
      {children}
    </>
  );
}
