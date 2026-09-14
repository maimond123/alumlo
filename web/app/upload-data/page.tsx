"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Upload, FileJson, Check, AlertTriangle, X, Loader2 } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { useOrganization } from "../contexts/OrganizationContext"

/**
 * Enrich Data.
 *
 * The 2025 page uploaded a file to blob storage and tracked a background job
 * in uploaded_data_progress_tracker, behind a Supabase login. This deployment
 * has no accounts, so that same endpoint would be an unauthenticated write
 * into production Postgres.
 *
 * It would not work anyway: ingest/seed.py derives its columns from
 * data/profiles/*.json, and every row then needs an embedding, which takes
 * minutes for a few hundred profiles against a 60s function limit. Ingestion
 * is a CLI job. What this page can do is check a file against what seed.py
 * expects before you run it, which is the part that actually goes wrong.
 */

/** Same fold seed.py applies before matching a company name. */
const norm = (s: unknown): string =>
  String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')

interface Report {
  fileName: string
  total: number
  named: number
  withExperience: number
  withEducation: number
  withProfileUrl: number
  matchingTenant: number
  unknownKeys: string[]
  problems: string[]
}

const KNOWN_KEYS = new Set([
  'basic_info',
  'experience',
  'education',
  'certifications',
  'recommendations',
  'original_url',
  'original_username',
])

function analyse(fileName: string, parsed: unknown, tenantName: string): Report {
  const problems: string[] = []

  if (!Array.isArray(parsed)) {
    return {
      fileName,
      total: 0,
      named: 0,
      withExperience: 0,
      withEducation: 0,
      withProfileUrl: 0,
      matchingTenant: 0,
      unknownKeys: [],
      problems: [
        'The top level is not an array. seed.py expects each file to be a JSON array of profile records.',
      ],
    }
  }

  const tenantKey = norm(tenantName)
  const unknown = new Set<string>()
  let named = 0
  let withExperience = 0
  let withEducation = 0
  let withProfileUrl = 0
  let matchingTenant = 0
  let notObjects = 0

  for (const record of parsed) {
    if (typeof record !== 'object' || record === null) {
      notObjects++
      continue
    }
    const r = record as Record<string, unknown>

    for (const key of Object.keys(r)) {
      if (!KNOWN_KEYS.has(key)) unknown.add(key)
    }

    const basic = (r.basic_info ?? {}) as Record<string, unknown>
    if (typeof basic.fullname === 'string' && basic.fullname.trim()) named++

    const experience = Array.isArray(r.experience) ? r.experience : []
    if (experience.length > 0) withExperience++

    const education = Array.isArray(r.education) ? r.education : []
    if (education.length > 0) withEducation++

    if (typeof r.original_url === 'string' && r.original_url.trim()) withProfileUrl++

    // seed.py finds the tenure by substring-matching the folded company name.
    const hit = experience.some(
      (e) =>
        typeof e === 'object' &&
        e !== null &&
        tenantKey &&
        norm((e as Record<string, unknown>).company).includes(tenantKey)
    )
    if (hit) matchingTenant++
  }

  if (notObjects > 0) {
    problems.push(`${notObjects} entries are not objects and will be skipped.`)
  }
  if (named < parsed.length) {
    problems.push(
      `${parsed.length - named} records have no basic_info.fullname; those profiles load with a null name.`
    )
  }
  if (matchingTenant < parsed.length) {
    problems.push(
      `${parsed.length - matchingTenant} records have no experience matching "${tenantName}". ` +
        'seed.py treats their whole career as post-tenure, so they get no exit year and no tenure length.'
    )
  }

  return {
    fileName,
    total: parsed.length,
    named,
    withExperience,
    withEducation,
    withProfileUrl,
    matchingTenant,
    unknownKeys: [...unknown],
    problems,
  }
}

function Stat({ label, value, of }: { label: string; value: number; of?: number }) {
  const pct = of && of > 0 ? Math.round((value / of) * 100) : null
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900 tabular-nums">
        {value.toLocaleString()}
        {pct !== null && <span className="text-gray-400 ml-2">({pct}%)</span>}
      </span>
    </div>
  )
}

export default function UploadDataPage() {
  const { isSidebarOpen } = useSidebar()
  const { tenant, isLoading: orgLoading, error: orgError } = useOrganization()

  const [report, setReport] = useState<Report | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setParseError(null)
    setReport(null)

    if (!file.name.toLowerCase().endsWith('.json')) {
      setParseError(
        `seed.py reads data/profiles/*.json, so "${file.name}" is not a format it consumes.`
      )
      return
    }

    setIsParsing(true)
    try {
      const parsed = JSON.parse(await file.text())
      setReport(analyse(file.name, parsed, tenant?.name ?? ''))
    } catch (err) {
      setParseError(
        `Could not parse ${file.name}: ${err instanceof Error ? err.message : 'invalid JSON'}`
      )
    } finally {
      setIsParsing(false)
    }
  }

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Enrich Data</h1>
          <p className="text-gray-600 mb-8">
            Check a profile file against what <code className="px-1 bg-gray-100 rounded">ingest/seed.py</code>{" "}
            expects before you load it. Nothing is uploaded — the file is read in
            your browser and never leaves it.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const file = e.dataTransfer.files?.[0]
              if (file) handleFile(file)
            }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
            {isParsing ? (
              <Loader2 className="w-8 h-8 mx-auto mb-3 text-gray-400 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            )}
            <p className="text-gray-900 font-medium">
              Drop a profiles <code className="px-1 bg-gray-100 rounded">.json</code> file here
            </p>
            <p className="text-sm text-gray-500 mt-1">
              A JSON array of records shaped like{" "}
              <code className="px-1 bg-gray-100 rounded">data/sample/profiles.json</code>
            </p>
          </div>

          {parseError && (
            <div className="mt-6 flex items-start gap-3 border border-red-300 bg-red-50 text-red-800 rounded-2xl px-5 py-4">
              <X className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{parseError}</p>
            </div>
          )}

          {report && (
            <div className="mt-8 space-y-6 pb-16">
              <section className="bg-white border border-black rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileJson className="w-5 h-5 text-gray-700" />
                  <h2 className="text-xl font-semibold text-gray-900">{report.fileName}</h2>
                </div>

                <Stat label="Records" value={report.total} />
                <Stat label="With a name" value={report.named} of={report.total} />
                <Stat label="With experience" value={report.withExperience} of={report.total} />
                <Stat label="With education" value={report.withEducation} of={report.total} />
                <Stat label="With a profile URL" value={report.withProfileUrl} of={report.total} />
                <Stat
                  label={`Mentioning ${tenant.name}`}
                  value={report.matchingTenant}
                  of={report.total}
                />

                {report.unknownKeys.length > 0 && (
                  <p className="text-sm text-gray-600 mt-4">
                    Ignored keys:{" "}
                    <span className="font-medium text-gray-800">
                      {report.unknownKeys.join(', ')}
                    </span>
                    . seed.py reads basic_info, experience, education and original_url;
                    anything else is left on the floor.
                  </p>
                )}
              </section>

              {report.problems.length > 0 ? (
                <section className="border border-amber-300 bg-amber-50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                    <h2 className="text-lg font-semibold text-amber-900">
                      Worth knowing before you load
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {report.problems.map((problem, i) => (
                      <li key={i} className="text-sm text-amber-900 flex gap-2">
                        <span className="shrink-0">•</span>
                        <span>{problem}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <section className="border border-emerald-300 bg-emerald-50 rounded-2xl p-6 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-700 shrink-0" />
                  <p className="text-sm text-emerald-900">
                    Every record has a name, experience and a tenure at {tenant.name}.
                  </p>
                </section>
              )}

              <section className="bg-white border border-black rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">To load it</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Ingestion runs from the repo, not from here: every profile needs an
                  embedding, which takes minutes for a few hundred rows and cannot
                  finish inside a 60-second function.
                </p>
                <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto">
{`cp ${report.fileName} data/profiles/

DATABASE_URL=... python ingest/seed.py \\
    --tenant ${tenant.slug} --name "${tenant.name}"

DATABASE_URL=... python ingest/embed.py --tenant ${tenant.slug}`}
                </pre>
                <p className="text-sm text-gray-600 mt-4">
                  Add <code className="px-1 bg-gray-100 rounded">--truncate</code> to replace
                  the tenant&apos;s existing rows rather than adding to them, and{" "}
                  <code className="px-1 bg-gray-100 rounded">--pseudonymize</code> to generate
                  names and drop profile URLs and photos.
                </p>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
