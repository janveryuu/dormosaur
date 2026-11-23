import type { Metadata } from 'next'
import { Article } from '@/components/docs/article'
import { getPage } from '@/lib/docs/content'

const page = getPage('')!

export const metadata: Metadata = {
  title: { absolute: 'Dormosaur Help' },
  description: page.description,
  alternates: { canonical: '/docs' },
}

export default function DocsHome() {
  return <Article page={page} />
}
