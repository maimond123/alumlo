'use client'

import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarProvider' // Ensure this path is correct

export default function DataInsightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSidebarOpen } = useSidebar()

  // Nominal widths of the sidebar panel itself (from Sidebar.tsx animation)
  const sidebarOpenPanelWidth = 18; // rem
  // const sidebarClosedPanelWidth = 6; // rem - We'll use a custom margin for closed state
  
  // The sidebar has a `left-2` class, which is 0.5rem offset
  const sidebarViewportOffset = 0.5; // rem

  // When sidebar is open, reduce margin significantly for tighter layout
  const marginLeftOpen = "16rem"; // Reduced from 18.5rem

  // When sidebar is closed, use much smaller margin for minimal gap
  const marginLeftClosed = "3.5rem"; // Reduced from 5.25rem

  const currentMarginLeft = isSidebarOpen ? marginLeftOpen : marginLeftClosed;

  return (
    // Use h-full to take the full height of the scaled body parent.
    <div className="h-full bg-gray-50">
      <Sidebar /> {/* Sidebar is position:fixed and will overlay on top of this div */}
      
      {/* Main content area */}
      <main
        className="h-full overflow-y-auto" // Takes full height of its parent, content scrolls vertically
        style={{
          marginLeft: currentMarginLeft,
          // Optional: Add transition if sidebar width transition is also present and matches.
          // transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        {/* Inner div for padding and ensuring minimum height for the content area */}
        <div className="p-4 min-h-full"> {/* p-4 for padding, min-h-full to fill vertical space */}
          {children}
        </div>
      </main>
    </div>
  )
}

