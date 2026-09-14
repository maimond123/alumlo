"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Loader2, Trash2, BarChart2 } from "lucide-react"
import Link from "next/link"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { useOrganization } from "../contexts/OrganizationContext"
import { listRecents, clearRecents, RECENTS_CHANGED } from "../utils/recents"

/**
 * Settings.
 *
 * The 2025 page managed a signed-in person: their saved leads, their search
 * history, their learn conversations, all keyed to an email. There are no
 * accounts, so the only state worth managing here is the tenant being viewed
 * and the history this browser has accumulated.
 */

interface TenantInsights {
  totalProfiles: number
  coverage: Record<string, number>
  unavailable: string[]
}

const COVERAGE_LABELS: Record<string, string> = {
  salary: "Salary",
  job_level: "Job level",
  career_stage: "Career stage",
  industry: "Industry",
}

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white border border-black rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {description ? (
        <p className="text-sm text-gray-600 mt-1 mb-4">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900 tabular-nums">{value}</span>
    </div>
  )
}

export default function SettingsPage() {
  const { isSidebarOpen } = useSidebar()
  const { tenant, isLoading: orgLoading, error: orgError } = useOrganization()

  const [insights, setInsights] = useState<TenantInsights | null>(null)
  const [counts, setCounts] = useState({ searches: 0, chats: 0 })

  useEffect(() => {
    if (!tenant) return
    fetch(`/api/insights?tenant=${encodeURIComponent(tenant.slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setInsights)
      .catch(() => setInsights(null))
  }, [tenant])

  useEffect(() => {
    if (!tenant) return
    const refresh = () =>
      setCounts({
        searches: listRecents('searches', tenant.slug).length,
        chats: listRecents('chats', tenant.slug).length,
      })
    refresh()
    window.addEventListener(RECENTS_CHANGED, refresh)
    return () => window.removeEventListener(RECENTS_CHANGED, refresh)
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
        className={`flex-1 relative transition-all duration-300 ease-in-out overflow-y-auto ${
          isSidebarOpen ? "ml-72" : "ml-24"
        }`}
      >
        <div className="min-h-screen px-8 py-10 max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600 mb-8">
            There are no user accounts in this deployment, so everything here is
            either the tenant you are viewing or state held by this browser.
          </p>

          <div className="space-y-6 pb-16">
            <Panel
              title="Organization"
              description="The tenant every search, chat and chart on this site is scoped to."
            >
              <Row label="Name" value={tenant.name} />
              <Row label="Slug" value={tenant.slug} />
              <Row label="Profiles" value={tenant.profileCount.toLocaleString()} />
              <p className="text-sm text-gray-600 mt-4">
                Switch tenants by adding <code className="px-1 bg-gray-100 rounded">?tenant=</code>
                {" "}to the URL — for example{" "}
                <code className="px-1 bg-gray-100 rounded">/search?tenant=demo</code>. The slug
                resolves against the <code className="px-1 bg-gray-100 rounded">tenants</code> table,
                so an unknown one is an error rather than an empty result set.
              </p>
            </Panel>

            <Panel
              title="This browser's history"
              description="Recent searches and chats live in localStorage, not in the database. Clearing them here removes them from this browser only."
            >
              <Row label="Saved searches" value={String(counts.searches)} />
              <Row label="Saved chats" value={String(counts.chats)} />

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => clearRecents('searches', tenant.slug)}
                  disabled={counts.searches === 0}
                  className="px-4 py-2 border border-black rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear searches
                </button>
                <button
                  onClick={() => clearRecents('chats', tenant.slug)}
                  disabled={counts.chats === 0}
                  className="px-4 py-2 border border-black rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear chats
                </button>
              </div>
            </Panel>

            <Panel
              title="Data coverage"
              description="Which fields the corpus actually populates. Search and Learn only answer along dimensions that have data."
            >
              {insights ? (
                <>
                  <Row
                    label="Profiles in corpus"
                    value={insights.totalProfiles.toLocaleString()}
                  />
                  <Row
                    label="With a current employer"
                    value={(insights.coverage.current_company ?? 0).toLocaleString()}
                  />
                  <Row
                    label="With an exit year"
                    value={(insights.coverage.exit_year ?? 0).toLocaleString()}
                  />
                  {insights.unavailable.length > 0 && (
                    <p className="text-sm text-gray-600 mt-4">
                      No data for{" "}
                      <span className="font-medium text-gray-800">
                        {insights.unavailable
                          .map((d) => COVERAGE_LABELS[d] ?? d)
                          .join(", ")}
                      </span>
                      . These are enrichment fields the corpus never populated.
                    </p>
                  )}
                  <Link
                    href="/data-insights"
                    className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-gray-900 hover:underline"
                  >
                    <BarChart2 className="w-4 h-4" />
                    See the full breakdown
                  </Link>
                </>
              ) : (
                <p className="text-sm text-gray-600">Coverage is unavailable.</p>
              )}
            </Panel>
          </div>
        </div>
      </main>
    </div>
  )
}
