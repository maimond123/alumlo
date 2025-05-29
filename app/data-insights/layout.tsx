export default function DataInsightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full bg-gradient-to-br from-forest-green via-emerald-green to-emerald-green/50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  )
}

