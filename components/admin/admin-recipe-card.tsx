import Image from 'next/image'
import { Clock, ListChecks, Users, Utensils } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AdminRecipe } from '@/lib/admin-recipes'

export function AdminRecipeCard({ recipe }: { recipe: AdminRecipe }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-ios border border-border/40 transition-all hover:shadow-ios-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/60">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.name}
            fill
            sizes="(min-width: 1024px) 320px, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary/10 via-muted/40 to-secondary/60 text-muted-foreground">
            <Utensils className="size-7 text-primary/60" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground/80">
              {recipe.appliance}
            </span>
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-[11.5px] font-bold tracking-[0.02em] text-foreground backdrop-blur-md shadow-xs border border-border/40">
          {recipe.mealType}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-[16.5px] leading-snug font-bold tracking-[-0.015em] text-pretty">
          {recipe.name}
        </h3>
        <p className="line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
          {recipe.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[10.5px]">
            {recipe.appliance}
          </Badge>
          <Badge variant="outline" className="text-[10.5px]">
            <ListChecks className="mr-1 size-3" />
            {recipe.ingredientCount} ingredients
          </Badge>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[12px] font-semibold text-muted-foreground border-t border-border/40 pt-2">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5 text-primary" strokeWidth={2.2} />
            {recipe.cookTimeMinutes}m
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5 text-primary" strokeWidth={2.2} />
            {recipe.servings}
          </span>
          <span className="ml-auto font-extrabold text-foreground text-sm">
            ₱{recipe.costPHP}
          </span>
        </div>
      </div>
    </div>
  )
}
