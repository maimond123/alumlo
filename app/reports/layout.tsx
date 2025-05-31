'use client'

import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarProvider'

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSidebarOpen } = useSidebar()

  // When sidebar is open, it extends to 18.5rem (18rem width + 0.5rem left offset)
  // Set margin slightly beyond that but much less than before for tighter layout
  const marginLeftOpen = "19rem"; // Just barely clears the sidebar for minimal gap

  // When sidebar is closed, use small margin for minimal gap  
  const marginLeftClosed = "3.5rem";

  const currentMarginLeft = isSidebarOpen ? marginLeftOpen : marginLeftClosed;

  return (
    // Use h-full to take the full height of the scaled body parent.
    <div className="h-full bg-gray-50">
      <Sidebar /> 
      
      <main
        className="h-full overflow-y-auto" 
        style={{
          marginLeft: currentMarginLeft,
        }}
      >
        <div className="p-4 min-h-full"> 
          {children}
        </div>
      </main>
    </div>
  )
} 