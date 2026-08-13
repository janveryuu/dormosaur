'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface CountryRow {
  code: string
  name: string
  flag: string
  timezone: string
  studentsCount: number
  percentage: string
  status: string
}

export function CountriesTable({ countries }: { countries: CountryRow[] }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-ios border border-border/40">
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-background/30">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-bold">Country / Region</TableHead>
              <TableHead className="font-bold">Active Timezone</TableHead>
              <TableHead className="font-bold">Registered Students</TableHead>
              <TableHead className="font-bold">User Share</TableHead>
              <TableHead className="font-bold text-right">Localization Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries.map((c) => (
              <TableRow key={c.code} className="border-border/40 hover:bg-accent/40">
                <TableCell>
                  <span className="flex items-center gap-2.5 font-bold tracking-[-0.01em]">
                    <span className="text-[20px]">{c.flag}</span>
                    {c.name} ({c.code})
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {c.timezone}
                </TableCell>
                <TableCell className="font-extrabold text-foreground tabular-nums">
                  {c.studentsCount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-bold">
                    {c.percentage}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    {c.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
