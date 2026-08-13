import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Clock, Users, Banknote, Flame, Lightbulb } from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { RecipeSteps } from '@/components/kitchen/recipe-steps'
import { PillLink } from '@/components/ios/pill-button'
import { RecipeDetailStats } from '@/components/kitchen/recipe-detail-stats'
import { recipes } from '@/lib/data'

export function generateStaticParams() {
  return recipes.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const recipe = recipes.find((r) => r.slug === slug)
  if (!recipe) return {}
  return { title: `${recipe.title} · Dormosaur Kitchen`, description: recipe.blurb }
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const recipe = recipes.find((r) => r.slug === slug)
  if (!recipe) notFound()

  return (
    <div className="pb-4">
      <ScreenHeader
        eyebrow={`${recipe.appliance} · ${recipe.meal}`}
        title={recipe.title}
        subtitle={recipe.blurb}
        backHref="/kitchen"
      />

      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl shadow-ios">
        <Image
          src={recipe.image || '/placeholder.svg'}
          alt={recipe.title}
          fill
          priority
          sizes="(min-width: 1024px) 720px, 100vw"
          className="object-cover"
        />
      </div>

      <RecipeDetailStats
        minutes={recipe.minutes}
        servings={recipe.servings}
        costUSD={recipe.costUSD}
        costString={recipe.cost}
        difficulty={recipe.difficulty}
      />

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          Ingredients
        </h2>
        <ul className="overflow-hidden rounded-3xl bg-card shadow-ios">
          {recipe.ingredients.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 border-b border-separator px-4 py-3 text-[15.5px] last:border-b-0"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8">
        <RecipeSteps steps={recipe.steps} />
      </div>

      <section className="mt-8 flex gap-3 rounded-3xl bg-accent p-5 text-accent-foreground">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={2.2} />
        <div className="flex flex-col gap-1">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Dorm tip</h2>
          <p className="text-[14.5px] leading-relaxed">{recipe.tip}</p>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <PillLink href="/kitchen" variant="secondary" size="lg" full>
          Browse more recipes
        </PillLink>
        <PillLink href="/dashboard" size="lg" full>
          Back to today
        </PillLink>
      </div>
    </div>
  )
}
