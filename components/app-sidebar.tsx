"use client"

import * as React from "react"
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
      url: "#",
      icon: Inbox,

    },
    {
      title: "Starred",
      url: "#",
      icon: Star,

    },
    {
      title: "Outbox",
      url: "#",
      icon: Send,

    },
    {
      title: "Spam",
      url: "#",
      icon: Mail,

    },
    {
      title: "Trash",
      url: "#",
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
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
