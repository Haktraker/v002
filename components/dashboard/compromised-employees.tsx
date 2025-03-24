"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatNumber } from "@/lib/utils"

interface Employee {
  id: string
  name: string
  email: string
  department: string
  attackCount: number
}

interface CompromisedEmployeesProps {
  employees: Employee[]
  maxAttacks?: number
}

export function CompromisedEmployees({ 
  employees, 
  maxAttacks = 10 
}: CompromisedEmployeesProps) {
  // Find the highest attack count to normalize the percentage bars
  const highestAttackCount = employees.reduce(
    (max, employee) => Math.max(max, employee.attackCount), 
    0
  )
  
  return (
    <Card className="dashboard-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="dashboard-text-primary">Most Compromised Employees</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-b dashboard-border">
              <TableHead className="dashboard-text-muted font-normal">Employee</TableHead>
              <TableHead className="dashboard-text-muted font-normal">Department</TableHead>
              <TableHead className="text-right dashboard-text-muted font-normal">Attacks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id} className="border-b dashboard-border">
                <TableCell className="py-2">
                  <div className="flex flex-col">
                    <span className="font-medium dashboard-text-primary">{employee.name}</span>
                    <span className="text-xs dashboard-text-muted">{employee.email}</span>
                  </div>
                </TableCell>
                <TableCell className="dashboard-text-secondary">{employee.department}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-medium text-primary">{formatNumber(employee.attackCount)}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ 
                          width: `${(employee.attackCount / highestAttackCount) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

