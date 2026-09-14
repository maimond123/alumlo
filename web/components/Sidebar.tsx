"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Search, Brain, BarChart2, Upload, Calendar, Clock, Settings } from "lucide-react"
import { useSidebar } from "./SidebarProvider"
import { useOrganization } from "../app/contexts/OrganizationContext"
import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from 'next/navigation'
import {
  listRecents,
  requestRestore,
  relativeTime,
  RECENTS_CHANGED,
  type RecentEntry,
  type RecentKind,
} from "../app/utils/recents"

/**
 * The sidebar identified the signed-in person and listed their saved searches
 * and chats. There are no accounts, so it identifies the tenant instead, and
 * the history it lists is per-browser rather than per-user.
 */
export default function Sidebar() {
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar()
  const { tenant } = useOrganization()
  const pathname = usePathname()
  const router = useRouter()

  // Only these two routes produce history worth listing.
  const recentKind: RecentKind | null =
    pathname === '/search' ? 'searches' : pathname === '/learn' ? 'chats' : null

  const [recents, setRecents] = useState<RecentEntry[]>([])

  useEffect(() => {
    if (!recentKind || !tenant) {
      setRecents([])
      return
    }
    const refresh = () => setRecents(listRecents(recentKind, tenant.slug))
    refresh()
    window.addEventListener(RECENTS_CHANGED, refresh)
    return () => window.removeEventListener(RECENTS_CHANGED, refresh)
  }, [recentKind, tenant, isSidebarOpen])

  const openRecent = (entry: RecentEntry) => {
    if (!recentKind || !tenant) return
    requestRestore(recentKind, tenant.slug, entry.id)
    const target = recentKind === 'searches' ? '/search' : '/learn'
    if (pathname !== target) router.push(target)
  }

  const initials = tenant
    ? tenant.name
        .split(/[\s-]+/)
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '--'

  return (
    <motion.div
      className={`fixed top-0 left-2 h-full bg-transparent flex flex-col border-r border-black z-20 overflow-hidden transition-[width] duration-300 ease-in-out`}
      initial={false}
      animate={{ width: isSidebarOpen ? "18rem" : "6rem" }}
      onMouseEnter={openSidebar}
      onMouseLeave={closeSidebar}
    >
      <div className="p-6 flex flex-col h-full w-full">
        {/* Logo Section with more space below */}
        <div
          className="flex items-center mb-16 transition-transform duration-300 ease-in-out"
          style={{ transform: isSidebarOpen ? "translateX(1rem)" : "translateX(0.75rem)" }}
        >
          <Image
            src="/assets/icons8-atom-48.png"
            alt="AlumIntel Logo"
            width={32}
            height={32}
            className="transition-transform duration-300 ease-in-out shrink-0"
          />
          <span
            className={`ml-3 text-black text-2xl font-bold transition-all duration-300 ease-in-out origin-left`}
            style={{ opacity: isSidebarOpen ? 1 : 0, transform: isSidebarOpen ? "scaleX(1)" : "scaleX(0)" }}
          >
            Alumlo
          </span>
        </div>

        {/* Navigation Links with more space between them */}
        <nav>
          <SidebarLink href="/search" icon={Search} isOpen={isSidebarOpen} currentPath={pathname}>
            Search
          </SidebarLink>
          <SidebarLink href="/learn" icon={Brain} isOpen={isSidebarOpen} currentPath={pathname}>
            Learn
          </SidebarLink>
          <SidebarLink href="/data-insights" icon={BarChart2} isOpen={isSidebarOpen} currentPath={pathname}>
            Visualize
          </SidebarLink>
          <SidebarLink href="/upload-data" icon={Upload} isOpen={isSidebarOpen} currentPath={pathname}>
            Enrich Data
          </SidebarLink>
        </nav>

        {/* Recent searches / chats. Hidden on the collapsed rail, which has no
            room for labels, and hidden entirely until there is history. */}
        {recentKind && isSidebarOpen && recents.length > 0 && (
          <div
            className="mt-2 mb-6 transition-all duration-300 ease-in-out"
            style={{ transform: "translateX(1rem)" }}
          >
            <div className="flex items-center gap-2 mb-3 text-black/60">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-xs uppercase tracking-wide whitespace-nowrap">
                {recentKind === 'searches' ? 'Recent Searches' : 'Recent Chats'}
              </span>
            </div>
            <ul className="space-y-1 pr-6">
              {recents.map((entry) => (
                <li key={entry.id}>
                  <button
                    onClick={() => openRecent(entry)}
                    title={entry.label}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-black/5 transition-colors group"
                  >
                    <span className="block text-sm text-black/80 group-hover:text-black truncate">
                      {entry.label}
                    </span>
                    <span className="block text-[11px] text-black/40">
                      {relativeTime(entry.at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Spacer to push profile to bottom */}
        <div className="flex-1"></div>

        {/* Settings - secondary, so it sits with the footer controls */}
        <div className="mb-6">
          <Link
            href="/settings"
            className={`flex items-center transition-all duration-300 ease-in-out relative ${
              pathname === '/settings' ? 'text-yellow-515' : 'text-black/90 hover:text-black'
            }`}
            style={{ transform: isSidebarOpen ? "translateX(1rem)" : "translateX(0.75rem)" }}
          >
            <Settings className="w-8 h-8 shrink-0" />
            <span
              className={`ml-3 text-lg transition-all duration-300 ease-in-out origin-left overflow-hidden whitespace-nowrap ${
                pathname === '/settings' ? 'font-semibold' : ''
              }`}
              style={{ opacity: isSidebarOpen ? 1 : 0, width: isSidebarOpen ? "auto" : 0 }}
            >
              Settings
            </span>
          </Link>
        </div>

        {/* Book Demo Button - positioned above profile */}
        <div className="mb-8">
          <a
            href="https://calendly.com/david-alumlo/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-black/90 hover:text-black transition-all duration-300 ease-in-out relative"
            style={{ transform: isSidebarOpen ? "translateX(1rem)" : "translateX(0.75rem)" }}
          >
            <Calendar className="w-8 h-8 shrink-0" />
            <span
              className="ml-3 text-lg transition-all duration-300 ease-in-out origin-left overflow-hidden whitespace-nowrap"
              style={{ opacity: isSidebarOpen ? 1 : 0, width: isSidebarOpen ? "auto" : 0 }}
            >
              Book Demo
            </span>
          </a>
        </div>

        {/* Tenant Section moved to bottom */}
        <div
          className="flex items-center transition-transform duration-300 ease-in-out w-full"
          style={{ transform: isSidebarOpen ? "translateX(1rem)" : "translateX(0.5rem)" }}
        >
          <div
            className={`w-10 h-10 rounded-full bg-emerald-green/20 border border-emerald-green/30 flex items-center justify-center shrink-0`}
          >
            <span className="text-black font-semibold text-base">{initials}</span>
          </div>
          <div
            className="ml-3 transition-all duration-300 ease-in-out origin-left overflow-hidden"
            style={{ opacity: isSidebarOpen ? 1 : 0, width: isSidebarOpen ? "auto" : 0 }}
          >
            <h3 className="text-black font-medium text-lg whitespace-nowrap">
              {tenant?.name ?? 'Loading...'}
            </h3>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SidebarLink({
  href,
  icon: Icon,
  children,
  isOpen,
  currentPath,
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  isOpen: boolean
  currentPath: string
}) {
  const isActive = currentPath === href

  return (
    <Link
      href={href}
      className="flex items-center text-black/90 hover:text-black mb-12 transition-all duration-300 ease-in-out relative"
      style={{ transform: isOpen ? "translateX(1rem)" : "translateX(0.75rem)" }}
    >
      <Icon className={`w-8 h-8 shrink-0 ${isActive ? 'text-yellow-515' : ''}`} />
      <span
        className={`ml-3 text-lg transition-all duration-300 ease-in-out origin-left overflow-hidden whitespace-nowrap ${
          isActive ? 'text-yellow-515 font-semibold' : ''
        }`}
        style={{ opacity: isOpen ? 1 : 0, width: isOpen ? "auto" : 0 }}
      >
        {children}
      </span>
    </Link>
  )
}
