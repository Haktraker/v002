"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatNumber } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface Employee {
  id: string
  name: string
  email: string
  department: string
  attackCount: number
}

interface CompromisedEmployeesProps {
  data: Employee[]
  isLoading?: boolean
}

export function CompromisedEmployees({ 
  data, 
  isLoading = false 
}: CompromisedEmployeesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
                <Skeleton className="h-4 w-[100px] ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find the highest attack count to normalize the percentage bars
  const highestAttackCount = data.reduce(
    (max, employee) => Math.max(max, employee.attackCount), 
    0
  )
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Compromised Employees</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground font-normal">Employee</TableHead>
              <TableHead className="text-muted-foreground font-normal">Department</TableHead>
              <TableHead className="text-right text-muted-foreground font-normal">Attacks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="py-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{employee.name}</span>
                    <span className="text-xs text-muted-foreground">{employee.email}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <span className="text-sm text-muted-foreground">{employee.department}</span>
                </TableCell>
                <TableCell className="py-2 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(employee.attackCount / highestAttackCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{formatNumber(employee.attackCount)}</span>
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
