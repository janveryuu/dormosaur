'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AdminUserRow } from '@/lib/admin-db'
import { formatDate, formatDateTime } from '@/lib/format-admin'

interface UsersTableProps {
  users: AdminUserRow[]
  totalCount: number
  totalPages: number
  currentPage: number
  initialSearch?: string
  initialFilter?: string
}

export function UsersTable({
  users,
  totalCount,
  totalPages,
  currentPage,
  initialSearch = '',
  initialFilter = 'all',
}: UsersTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialSearch)
  const [filter, setFilter] = useState(initialFilter)
  const [isPending, startTransition] = useTransition()

  const updateQueryParams = (newSearch: string, newFilter: string, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newSearch) params.set('search', newSearch)
    else params.delete('search')

    if (newFilter && newFilter !== 'all') params.set('filter', newFilter)
    else params.delete('filter')

    if (newPage > 1) params.set('page', newPage.toString())
    else params.delete('page')

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleSearchChange = (val: string) => {
    setQuery(val)
    updateQueryParams(val, filter, 1)
  }

  const handleFilterChange = (val: string) => {
    setFilter(val)
    updateQueryParams(query, val, 1)
  }

  const handlePageChange = (newPage: number) => {
    updateQueryParams(query, filter, newPage)
  }

  return (
    <div className="rounded-3xl bg-card p-5 shadow-ios border border-border/40">
      {/* Search & Filter Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email, or school..."
            className="h-10 rounded-full pl-9 bg-background/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-10 w-full rounded-full sm:w-48 bg-background/50">
              <SelectValue placeholder="All Students" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="dorm">Dormers Only</SelectItem>
              <SelectItem value="non-dorm">Non-Dormers</SelectItem>
              <SelectItem value="onboarded">Completed Onboarding</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="px-3 py-1.5 rounded-full text-xs font-bold">
            {totalCount} Total
          </Badge>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-background/30">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-bold">Student Name</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">School</TableHead>
              <TableHead className="font-bold">Country</TableHead>
              <TableHead className="font-bold">Dorm Student</TableHead>
              <TableHead className="font-bold">Signup Date</TableHead>
              <TableHead className="font-bold">Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const initials = u.name
                ? u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                : 'ST'

              return (
                <TableRow key={u.id} className="border-border/40 hover:bg-accent/40 transition-colors">
                  <TableCell>
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 group">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11.5px] font-bold shadow-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {initials}
                      </span>
                      <span className="font-semibold text-foreground tracking-[-0.01em] group-hover:underline">
                        {u.name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{u.email}</TableCell>
                  <TableCell className="text-foreground/90 font-medium">{u.school}</TableCell>
                  <TableCell>
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-muted/60">
                      {u.country || 'PH'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.is_dorm_student ? 'default' : 'outline'}
                      className={u.is_dorm_student ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                    >
                      {u.is_dorm_student ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatDate(u.created_at)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-semibold">{formatDateTime(u.last_sign_in_at)}</TableCell>
                </TableRow>
              )
            })}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User className="size-8 text-muted-foreground/50" />
                    <p className="font-semibold text-sm">No registered students found.</p>
                    <p className="text-xs">Try clearing search or filter parameters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground">
          <span>
            Page {currentPage} of {totalPages} ({totalCount} total students)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-8 rounded-full gap-1"
            >
              <ChevronLeft className="size-3.5" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isPending}
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-8 rounded-full gap-1"
            >
              Next <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
