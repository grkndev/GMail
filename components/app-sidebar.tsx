"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  Inbox,
  LifeBuoy,
  Mail,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  Star,
  Trash,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"

const data = {
  user: {
    name: "GrknDev",
    email: "info@grkn.dev",
    avatar: "https://github.com/grkndev.png",
  },
  navMain: [
    {
      title: "Incoming",
      url: "#inbox",
      icon: Inbox,
    },
    {
      title: "Starred",
      url: "#starred",
      icon: Star,
    },
    {
      title: "Outbox",
      url: "#outbox",
      icon: Send,
    },
    {
      title: "Spam",
      url: "#spam",
      icon: Mail,
    },
    {
      title: "Trash",
      url: "#trash",
      icon: Trash,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [currentHash, setCurrentHash] = useState('')

  // Get current hash from URL
  const getCurrentHash = () => {
    if (typeof window !== 'undefined') {
      return window.location.hash.replace('#', '')
    }
    return ''
  }

  // Handle hash changes and set initial hash
  useEffect(() => {
    const handleHashChange = () => {
      const newHash = getCurrentHash()
      setCurrentHash(newHash)
    }

    // Set initial hash
    const initialHash = getCurrentHash()
    setCurrentHash(initialHash)

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  // Map hash to navigation item and set isActive
  const getActiveNavData = () => {
    const hashToNavMap: Record<string, string> = {
      'inbox': 'Incoming',
      'starred': 'Starred', 
      'outbox': 'Outbox',
      'spam': 'Spam',
      'trash': 'Trash',
      '': 'Incoming' // Default to Incoming when no hash
    }

    const activeTitle = hashToNavMap[currentHash] || 'Incoming'

    return {
      ...data,
      navMain: data.navMain.map(item => ({
        ...item,
        isActive: item.title === activeTitle
      }))
    }
  }

  const activeData = getActiveNavData()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className=" text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image src={"/gdev_logo_black.png"} alt="GrknDev" width={32} height={32} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">GrknDev Mail</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={activeData.navMain} />
        <NavSecondary items={activeData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={activeData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
