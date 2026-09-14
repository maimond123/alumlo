"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { useOrganization } from "../contexts/OrganizationContext"
import { BarChart, LineChart, PieChart } from "../../components/chart"

/**
 * Visualize.
 *
 * The 2025 page charted `demo_survey_responses` -- salary lift, industry mix,
 * executive attainment -- none of which exists in the corpus. This one draws
 * only what getTenantInsights can compute, and names the dimensions it cannot
 * rather than filling them in.
 */

interface Bucket {
  name: string
  count: number
  pct: number
}

interface TenantInsights {
  tenantName: string
  totalProfiles: number
  coverage: Record<string, number>
  unavailable: string[]
  topCurrentCompanies: Bucket[]
  topCurrentTitles: Bucket[]
  topLocations: Bucket[]
  topUndergraduateSchools: Bucket[]
  exitYears: Array<{ year: number; count: number }>
  tenureYears: { mean: number | null; median: number | null; buckets: Bucket[] }
  positionsPerProfile: { mean: number | null }
}

/** Charts take {name, value}; the API speaks {name, count}. */
const toChartData = (buckets: Bucket[]) =>
  buckets.map((b) => ({ name: b.name, value: b.count }))

/** Long company and school names overwhelm a 12-bar axis. */
const truncate = (label: string, max = 28) =>
  label.length > max ? `${label.slice(0, max - 1)}…` : label

const COVERAGE_LABELS: Record<string, string> = {
  current_company: "Current company",
  current_title: "Current title",
  location: "Location",
  exit_year: "Exit year",
  tenure: "Tenure",
  positions: "Positions held",
  undergraduate_school: "Undergraduate school",
  salary: "Salary",
  job_level: "Job level",
  career_stage: "Career stage",
  industry: "Industry",
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-black rounded-2xl px-6 py-5 shadow-sm">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub ? <p className="text-sm text-gray-500 mt-1">{sub}</p> : null}
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white border border-black rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {subtitle ? <p className="text-sm text-gray-600 mt-1 mb-2">{subtitle}</p> : null}
      {children}
    </section>
  )
}

export default function DataInsightsPage() {
  const { isSidebarOpen } = useSidebar()
  const { tenant, isLoading: orgLoading, error: orgError } = useOrganization()

  const [insights, setInsights] = useState<TenantInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenant) return
    setIsLoading(true)
    fetch(`/api/insights?tenant=${encodeURIComponent(tenant.slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`)
        return res.json()
      })
      .then(setInsights)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [tenant])

  if (orgLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!tenant) {
    return <div className="p-8">No tenant found. {orgError}</div>
  }

  return (
    <div className="flex h-full bg-white overflow-hidden">
      <Sidebar />
      <main
        className={`flex-1 min-w-0 relative transition-all duration-300 ease-in-out overflow-y-auto ${
          isSidebarOpen ? "ml-72" : "ml-24"
        }`}
      >
        <div className="min-h-screen w-full px-8 py-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {tenant.name} Alumni
          </h1>
          <p className="text-gray-600 mb-8">
            Aggregates computed over the profile corpus. Every figure is a count
            from the database, not an estimate.
          </p>

          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading insights&hellip;
            </div>
          ) : error ? (
            <div className="border border-red-300 bg-red-50 text-red-800 rounded-2xl px-6 py-4">
              Could not load insights: {error}
            </div>
          ) : insights ? (
            <div className="space-y-8 pb-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile
                  label="Profiles"
                  value={insights.totalProfiles.toLocaleString()}
                />
                <StatTile
                  label="Mean tenure"
                  value={
                    insights.tenureYears.mean !== null
                      ? `${insights.tenureYears.mean} yrs`
                      : "—"
                  }
                  sub={
                    insights.tenureYears.median !== null
                      ? `median ${insights.tenureYears.median} yrs`
                      : undefined
                  }
                />
                <StatTile
                  label="Positions per profile"
                  value={
                    insights.positionsPerProfile.mean !== null
                      ? String(insights.positionsPerProfile.mean)
                      : "—"
                  }
                  sub="mean"
                />
                <StatTile
                  label="With a known employer"
                  value={(insights.coverage.current_company ?? 0).toLocaleString()}
                  sub={
                    insights.totalProfiles
                      ? `${Math.round(
                          ((insights.coverage.current_company ?? 0) /
                            insights.totalProfiles) *
                            100
                        )}% of corpus`
                      : undefined
                  }
                />
              </div>

              {insights.topCurrentCompanies.length > 0 && (
                <Panel
                  title="Where alumni work now"
                  subtitle={`Top ${insights.topCurrentCompanies.length} of ${(
                    insights.coverage.current_company ?? 0
                  ).toLocaleString()} profiles with a current employer.`}
                >
                  <BarChart
                    data={toChartData(insights.topCurrentCompanies).map((d) => ({
                      ...d,
                      name: truncate(d.name),
                    }))}
                  />
                </Panel>
              )}

              {insights.topCurrentTitles.length > 0 && (
                <Panel title="What they do">
                  <BarChart
                    data={toChartData(insights.topCurrentTitles).map((d) => ({
                      ...d,
                      name: truncate(d.name),
                    }))}
                  />
                </Panel>
              )}

              {insights.topLocations.length > 0 && (
                <Panel title="Where they are">
                  <BarChart
                    data={toChartData(insights.topLocations).map((d) => ({
                      ...d,
                      name: truncate(d.name),
                    }))}
                  />
                </Panel>
              )}

              {insights.exitYears.length > 0 && (
                <Panel
                  title="When they left"
                  subtitle="Departures per year across the corpus."
                >
                  <LineChart
                    data={insights.exitYears.map((e) => ({
                      name: String(e.year),
                      value: e.count,
                    }))}
                  />
                </Panel>
              )}

              {insights.tenureYears.buckets.length > 0 && (
                <Panel
                  title="How long they stayed"
                  subtitle={
                    insights.tenureYears.median !== null
                      ? `Median ${insights.tenureYears.median} years.`
                      : undefined
                  }
                >
                  <PieChart data={toChartData(insights.tenureYears.buckets)} />
                </Panel>
              )}

              {insights.topUndergraduateSchools.length > 0 && (
                <Panel title="Where they studied">
                  <BarChart
                    data={toChartData(insights.topUndergraduateSchools).map((d) => ({
                      ...d,
                      name: truncate(d.name),
                    }))}
                  />
                </Panel>
              )}

              <Panel
                title="Coverage"
                subtitle="How many profiles carry each field. A dimension at zero is not charted above."
              >
                <div className="mt-3 space-y-2">
                  {Object.entries(COVERAGE_LABELS).map(([key, label]) => {
                    const n = insights.coverage[key] ?? 0
                    const pct = insights.totalProfiles
                      ? (n / insights.totalProfiles) * 100
                      : 0
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <span className="w-52 shrink-0 text-sm text-gray-700">
                          {label}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              n === 0 ? "bg-gray-300" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.max(pct, n === 0 ? 0 : 1)}%` }}
                          />
                        </div>
                        <span className="w-28 shrink-0 text-sm text-gray-600 text-right tabular-nums">
                          {n.toLocaleString()} ({Math.round(pct)}%)
                        </span>
                      </div>
                    )
                  })}
                </div>

                {insights.unavailable.length > 0 && (
                  <p className="mt-5 text-sm text-gray-600 border-t border-gray-200 pt-4">
                    No data for{" "}
                    <span className="font-medium text-gray-800">
                      {insights.unavailable
                        .map((d) => COVERAGE_LABELS[d] ?? d)
                        .join(", ")}
                    </span>
                    . These are enrichment fields the corpus never populated, so
                    they are left blank rather than estimated.
                  </p>
                )}
              </Panel>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
