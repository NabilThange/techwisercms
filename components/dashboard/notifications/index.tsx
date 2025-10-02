"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bullet } from "@/components/ui/bullet"
import NotificationItem from "./notification-item"
import type { Notification } from "@/types/dashboard"
import { AnimatePresence, motion } from "framer-motion"
import useSWR from "swr"

interface NotificationsProps {
  initialNotifications: Notification[]
}

const fetcher = async (url: string) => {
  const password = typeof window !== "undefined" ? localStorage.getItem("dashboard_password") : null
  const response = await fetch(url, {
    headers: { "x-dashboard-password": password || "" },
  })
  if (!response.ok) throw new Error("Failed to fetch")
  return response.json()
}

export default function Notifications({ initialNotifications }: NotificationsProps) {
  const { data: logsData, error } = useSWR("/api/dashboard/logs", fetcher, {
    refreshInterval: 120000, // Refresh every 2 minutes
    fallbackData: null,
    revalidateOnFocus: false,
  })

  const transformedNotifications: Notification[] = logsData?.logs
    ? logsData.logs.map((log: any) => ({
        id: log.id,
        title: log.message.toUpperCase(),
        message: `Deployment ${log.details.state} - ${log.details.url || "N/A"}`,
        timestamp: new Date(log.timestamp).toISOString(),
        type: log.type,
        read: false,
        priority: log.type === "error" ? "high" : log.type === "success" ? "medium" : "low",
      }))
    : initialNotifications

  const [notifications, setNotifications] = useState<Notification[]>(transformedNotifications)
  const [showAll, setShowAll] = useState(false)

  React.useEffect(() => {
    if (logsData?.logs) {
      setNotifications(transformedNotifications)
    }
  }, [logsData])

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 3)

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between pl-3 pr-1">
        <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase">
          {unreadCount > 0 ? <Badge>{unreadCount}</Badge> : <Bullet />}
          Notifications
        </CardTitle>
        {notifications.length > 0 && (
          <Button className="opacity-50 hover:opacity-100 uppercase" size="sm" variant="ghost" onClick={clearAll}>
            Clear All
          </Button>
        )}
      </CardHeader>

      <CardContent className="bg-accent p-1.5 overflow-hidden">
        <div className="space-y-2">
          <AnimatePresence initial={false} mode="popLayout">
            {displayedNotifications.map((notification) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                key={notification.id}
              >
                <NotificationItem notification={notification} onMarkAsRead={markAsRead} onDelete={deleteNotification} />
              </motion.div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            )}

            {notifications.length > 3 && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
              >
                <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="w-full">
                  {showAll ? "Show Less" : `Show All (${notifications.length})`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
