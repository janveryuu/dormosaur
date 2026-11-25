import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Article } from '@/components/docs/article'
import { getPage, pages } from '@/lib/docs/content'

export const dynamicParams = false

export function generateStaticParams() {
  return pages.filter(p => p.slug).map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = getPage(slug)
  if (!page) return {}
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/docs/${slug}` },
    openGraph: { title: `Dormosaur Help: ${page.title}`, description: page.description },
  }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = getPage(slug)
  if (!page) notFound()
  return <Article page={page} />
}
