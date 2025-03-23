"use client"

import { useTheme } from "@/components/theme-provider"

interface CompromisedEmployee {
  id: string
  email: string
  attacks: number
}

interface CompromisedEmployeesProps {
  employees: CompromisedEmployee[]
}

export function CompromisedEmployees({ employees }: CompromisedEmployeesProps) {
  const { isDarkMode } = useTheme()

  // Find the highest attack value for relative scaling
  const maxAttacks = Math.max(...employees.map((emp) => emp.attacks), 1)

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
        <span># Email</span>
        <div className="flex gap-6">
          <span>Attacks</span>
          <span className="w-10"></span>
        </div>
      </div>

      {employees.map((employee, index) => (
        <div key={employee.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
            <span className="text-sm">{employee.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <div className="flex-1 h-1.5 w-36 bg-muted/30 rounded-full overflow-hidden transition-colors duration-200">
                <div
                  className={`h-full rounded-full ${getBarColor(employee.attacks, isDarkMode)}`}
                  style={{ width: `${(employee.attacks / maxAttacks) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-medium w-10 text-right">{employee.attacks}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function getBarColor(attacks: number, isDarkMode: boolean): string {
  // Theme-aware colors
  if (attacks >= 300) return isDarkMode ? "bg-red-500" : "bg-red-600"
  if (attacks >= 200) return isDarkMode ? "bg-orange-500" : "bg-orange-600"
  if (attacks >= 150) return isDarkMode ? "bg-amber-500" : "bg-amber-600"
  if (attacks >= 100) return isDarkMode ? "bg-blue-500" : "bg-blue-600"
  return isDarkMode ? "bg-green-500" : "bg-green-600"
}

