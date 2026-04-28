export const dynamic = "force-static";

export default function SimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="glow-line w-full" />
      {children}
    </div>
  );
}
