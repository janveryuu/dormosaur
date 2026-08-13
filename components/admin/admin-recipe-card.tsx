import Image from 'next/image'
import { Clock, Eye, PencilLine, Trash2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Recipe } from '@/lib/admin-recipes'

export function AdminRecipeCard({
  recipe,
  onEdit,
  onDelete,
}: {
  recipe: Recipe
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-ios border border-border/40 transition-all hover:shadow-ios-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={recipe.image || '/placeholder.jpg'}
          alt={recipe.name}
          fill
          sizes="(min-width: 1024px) 320px, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute top-3 left-3 rounded-full bg-background/80 px-2.5 py-1 text-[11.5px] font-bold tracking-[0.02em] text-foreground backdrop-blur-md shadow-xs border border-border/40">
          {recipe.mealType}
        </span>
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="sm"
            variant="secondary"
            className="size-8 rounded-full shadow-ios-sm p-0"
            onClick={onEdit}
            aria-label={`Edit ${recipe.name}`}
          >
            <PencilLine className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="size-8 rounded-full shadow-ios-sm p-0"
            onClick={onDelete}
            aria-label={`Delete ${recipe.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-[16.5px] leading-snug font-bold tracking-[-0.015em] text-pretty">
          {recipe.name}
        </h3>
        <p className="line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
          {recipe.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {recipe.dietaryTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10.5px]">
              {tag}
            </Badge>
          ))}
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
          <span className="flex items-center gap-1 font-extrabold text-foreground text-sm">
            ${recipe.costUSD.toFixed(2)}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Eye className="size-3.5" strokeWidth={2.2} />
            {recipe.views.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
