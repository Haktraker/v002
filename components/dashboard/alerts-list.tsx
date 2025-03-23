"use client"

import { AlertTriangle, AlertCircle, Info } from "lucide-react"

type AlertSeverity = "high" | "medium" | "low"

interface Alert {
  id: number
  title: string
  description: string
  time: string
  severity: AlertSeverity
}

interface AlertsListProps {
  severity?: AlertSeverity
}

const alerts: Alert[] = [
  {
    id: 1,
    title: "Credential Leak Detected",
    description: "Multiple user credentials found on dark web forum",
    time: "10 minutes ago",
    severity: "high",
  },
  {
    id: 2,
    title: "Unusual Login Activity",
    description: "Multiple failed login attempts from unknown IP",
    time: "1 hour ago",
    severity: "high",
  },
  {
    id: 3,
    title: "Domain Impersonation",
    description: "Similar domain registered with slight variation",
    time: "3 hours ago",
    severity: "medium",
  },
  {
    id: 4,
    title: "Outdated SSL Certificate",
    description: "SSL certificate expiring in 14 days",
    time: "5 hours ago",
    severity: "low",
  },
  {
    id: 5,
    title: "New Attack Surface Detected",
    description: "New subdomain discovered with potential vulnerabilities",
    time: "1 day ago",
    severity: "medium",
  },
]

export function AlertsList({ severity }: AlertsListProps) {
  const filteredAlerts = severity ? alerts.filter((alert) => alert.severity === severity) : alerts

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-5 w-5 text-cyber-secondary" />
      case "medium":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case "low":
        return <Info className="h-5 w-5 text-cyber-primary" />
    }
  }

  const getSeverityClass = (severity: AlertSeverity) => {
    switch (severity) {
      case "high":
        return "bg-red-900/20 border-red-900/50"
      case "medium":
        return "bg-amber-900/20 border-amber-900/50"
      case "low":
        return "bg-green-900/20 border-green-900/50"
    }
  }

  return (
    <div className="space-y-3">
      {filteredAlerts.length === 0 ? (
        <div className="text-center text-muted-foreground py-4">No alerts found</div>
      ) : (
        filteredAlerts.map((alert) => (
          <div key={alert.id} className={`p-3 rounded-md border ${getSeverityClass(alert.severity)}`}>
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">{getSeverityIcon(alert.severity)}</div>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{alert.title}</h4>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

