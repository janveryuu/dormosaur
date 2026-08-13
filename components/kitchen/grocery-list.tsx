'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { PillButton } from '@/components/ios/pill-button'
import { useSchedule } from '@/components/schedule-provider'

export function GroceryList() {
  const { groceryItems, toggleGroceryItem, addCustomGroceryItem, removeGroceryItem } =
    useSchedule()
  const [customInput, setCustomInput] = React.useState('')

  const checkedCount = groceryItems.filter((g) => g.checked).length
  const progress =
    groceryItems.length > 0 ? Math.round((checkedCount / groceryItems.length) * 100) : 0

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customInput.trim()) return
    addCustomGroceryItem(customInput)
    setCustomInput('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-3xl bg-card p-5 shadow-ios">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <ShoppingBag className="size-5" strokeWidth={2} />
            </span>
            <div>
              <h3 className="text-[17px] font-bold tracking-[-0.02em]">Dorm Grocery Checklist</h3>
              <p className="text-[13px] text-muted-foreground">
                {checkedCount} of {groceryItems.length} items collected
              </p>
            </div>
          </div>
          <span className="font-mono text-[18px] font-bold text-primary">{progress}%</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-fill">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full bg-primary"
          />
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Add custom item (e.g. Paper towels, Energy drink)"
          className="flex-1 rounded-2xl bg-card px-4 py-3 text-[14.5px] shadow-ios outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <PillButton type="submit" size="md">
          <Plus className="size-4" /> Add
        </PillButton>
      </form>

      {groceryItems.length > 0 ? (
        <div className="overflow-hidden rounded-3xl bg-card shadow-ios">
          <ul className="flex flex-col divide-y divide-separator">
            {groceryItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3.5">
                <button
                  onClick={() => toggleGroceryItem(item.id)}
                  className="flex flex-1 items-center gap-3 text-left focus-visible:outline-none"
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      item.checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-fill'
                    }`}
                  >
                    {item.checked && <Check className="size-3.5" strokeWidth={2.8} />}
                  </span>
                  <span
                    className={`text-[15.5px] font-medium transition-colors ${
                      item.checked ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.custom && (
                    <span className="rounded-full bg-accent/60 px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                      Extra
                    </span>
                  )}
                </button>

                {item.custom && (
                  <button
                    onClick={() => removeGroceryItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="ml-2 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-3xl bg-card p-8 text-center text-[14.5px] text-muted-foreground shadow-ios">
          No ingredients yet. Plan recipes in the Meal Planner tab to generate your grocery list!
        </p>
      )}
    </div>
  )
}
