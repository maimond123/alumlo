'use client'

import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarProvider' // Ensure this path is correct

export default function DataInsightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSidebarOpen } = useSidebar()

  // These widths should match the widths defined in your Sidebar component
  const sidebarOpenWidth = "18rem"
  const sidebarClosedWidth = "6rem"
  const currentSidebarWidth = isSidebarOpen ? sidebarOpenWidth : sidebarClosedWidth

  return (
    // The parent div sets the overall height context.
    // bg-gray-50 is the background for the entire page area including behind the sidebar (if transparent)
    // and the main content area.
    <div className="h-screen bg-gray-50">
      <Sidebar /> {/* Sidebar is position:fixed and will overlay on top of this div */}
      
      {/* Main content area */}
      <main
        className="h-full overflow-y-auto" // Takes full height of its parent, content scrolls vertically
        style={{
          marginLeft: currentSidebarWidth,
          // Adding a transition for margin-left can make the content shift smoothly
          // when the sidebar opens/closes, if desired.
          // transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        {/* Inner div for padding and ensuring minimum height for the content area */}
        <div className="p-6 min-h-full"> {/* p-6 for padding, min-h-full to fill vertical space */}
          {children}
        </div>
      </main>
    </div>
  )
}

