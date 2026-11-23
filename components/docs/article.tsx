import { AlertTriangle, ArrowLeft, ArrowRight, ChevronRight, Info, Lightbulb, Mail } from 'lucide-react'
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import { docHref, getPage, neighbours, slugify, type Block, type DocPage } from '@/lib/docs/content'
import { Toc } from './toc'

/** Renders **bold**, `code`, and [text](/href) inside a string. */
function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1]) parts.push(<strong key={m.index} className="font-semibold text-[#0A1710]">{m[1]}</strong>)
    else if (m[2]) parts.push(<code key={m.index} className="rounded-md bg-[#F1F4F0] px-1.5 py-0.5 font-mono text-[0.88em] text-[#0B5E38]">{m[2]}</code>)
    else parts.push(<Link key={m.index} href={m[4]} className="font-medium text-[#0E7A4A] underline decoration-[#0E7A4A]/30 underline-offset-4 transition-colors hover:decoration-[#0E7A4A]">{m[3]}</Link>)
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

const calloutStyle = {
  note: { icon: Info, ring: 'border-[#CFE0F5] bg-[#F4F8FD]', tint: 'text-[#2F6FD0]' },
  tip: { icon: Lightbulb, ring: 'border-[#CDE9D7] bg-[#F3FAF5]', tint: 'text-[#0E7A4A]' },
  warn: { icon: AlertTriangle, ring: 'border-[#F3DDB5] bg-[#FFF9EE]', tint: 'text-[#B26B00]' },
}

function BlockView({ b }: { b: Block }) {
  if ('h2' in b) {
    const id = slugify(b.h2)
    return (
      <h2 id={id} className="group mt-12 scroll-mt-24 text-[24px] font-semibold tracking-[-0.02em] text-[#0A1710] first:mt-0">
        <a href={`#${id}`} className="outline-none focus-visible:underline">
          {b.h2}
          <span aria-hidden className="ml-2 text-[#0E7A4A]/0 transition-colors group-hover:text-[#0E7A4A]/50">#</span>
        </a>
      </h2>
    )
  }
  if ('p' in b) return <p className="mt-4 text-[16.5px] leading-[1.75] text-[#2E3A33]"><Inline text={b.p} /></p>
  if ('steps' in b) {
    return (
      <ol className="mt-5 space-y-3">
        {b.steps.map((s, i) => (
          <li key={i} className="flex gap-3.5 text-[16.5px] leading-[1.7] text-[#2E3A33]">
            <span aria-hidden className="mt-[3px] grid size-[26px] shrink-0 place-items-center rounded-full bg-[#E3F3E9] text-[13px] font-semibold text-[#0B5E38]">{i + 1}</span>
            <span><Inline text={s} /></span>
          </li>
        ))}
      </ol>
    )
  }
  if ('list' in b) {
    return (
      <ul className="mt-4 space-y-2.5">
        {b.list.map((s, i) => (
          <li key={i} className="flex gap-3 text-[16.5px] leading-[1.7] text-[#2E3A33]">
            <span aria-hidden className="mt-[11px] size-1.5 shrink-0 rounded-full bg-[#34C77B]" />
            <span><Inline text={s} /></span>
          </li>
        ))}
      </ul>
    )
  }
  if ('callout' in b) {
    const st = calloutStyle[b.callout]
    const Icon = st.icon
    return (
      <aside className={`mt-6 rounded-2xl border px-5 py-4 ${st.ring}`}>
        <p className="flex items-center gap-2 text-[15px] font-semibold text-[#0A1710]">
          <Icon className={`size-4 ${st.tint}`} aria-hidden /> {b.title}
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-[#3D4A42]"><Inline text={b.body} /></p>
      </aside>
    )
  }
  if ('contact' in b) {
    const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'janvermanlapaz@gmail.com'
    if (!email) return null
    return (
      <a href={`mailto:${email}?subject=${encodeURIComponent('Dormosaur help')}`} className="group mt-6 flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-[#F8FAF7] p-5 transition-all hover:border-[#34C77B]/50 hover:bg-white">
        <span className="grid size-11 place-items-center rounded-xl bg-[#0E7A4A] text-white"><Mail className="size-5" aria-hidden /></span>
        <span className="flex-1">
          <span className="block font-semibold text-[#0A1710]">Email support</span>
          <span className="block text-[14px] text-black/55">{email}</span>
        </span>
        <ArrowRight className="size-4 text-[#0E7A4A] transition-transform group-hover:translate-x-0.5" aria-hidden />
      </a>
    )
  }
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {b.cards.map(c => {
        const p = getPage(c.slug)
        if (!p) return null
        return (
          <Link key={c.slug} href={docHref(c.slug)} className="group rounded-2xl border border-black/[0.07] bg-[#F8FAF7] p-5 transition-all hover:-translate-y-0.5 hover:border-[#34C77B]/50 hover:bg-white hover:shadow-[0_14px_30px_-18px_rgba(14,122,74,0.5)]">
            <span className="flex items-center justify-between font-semibold text-[#0A1710]">
              {p.title}
              <ArrowRight className="size-4 text-[#0E7A4A] transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="mt-1.5 block text-[14px] leading-relaxed text-black/55">{c.blurb}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function Article({ page }: { page: DocPage }) {
  const headings = page.body.filter((b): b is { h2: string } => 'h2' in b).map(b => ({ id: slugify(b.h2), title: b.h2 }))
  const { prev, next } = neighbours(page.slug)
  const nextSteps = (page.next ?? []).map(getPage).filter((p): p is DocPage => !!p)

  return (
    <div className="mx-auto flex max-w-[1140px] gap-12 px-5 pb-24 pt-10 sm:px-8 lg:pt-14">
      <article className="min-w-0 max-w-[760px] flex-1">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-[13px] text-black/45">
          <Link href="/docs" className="hover:text-[#0E7A4A]">Help</Link>
          {page.slug && (
            <>
              <ChevronRight className="size-3.5" aria-hidden />
              <span>{page.group}</span>
            </>
          )}
        </nav>

        <h1 className="text-[44px] leading-[1.02] tracking-[-0.01em] text-[#0A1710] sm:text-[56px]" style={{ fontFamily: 'var(--font-serif-display), Georgia, serif' }}>
          {page.title}
        </h1>
        <p className="mt-4 text-[19px] leading-relaxed text-[#56645B]">{page.description}</p>

        {headings.length > 0 && (
          <details className="mt-8 rounded-2xl border border-black/[0.07] bg-[#F8FAF7] px-4 py-3 xl:hidden">
            <summary className="cursor-pointer text-[14px] font-semibold text-[#0A1710]">On this page</summary>
            <ul className="mt-2 space-y-1">
              {headings.map(h => (
                <li key={h.id}><a href={`#${h.id}`} className="block py-1 text-[14px] text-black/60 hover:text-[#0E7A4A]">{h.title}</a></li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-8">
          {page.body.map((b, i) => <Fragment key={i}><BlockView b={b} /></Fragment>)}
        </div>

        {nextSteps.length > 0 && (
          <section aria-labelledby="next-steps" className="mt-14">
            <h2 id="next-steps" className="text-[24px] font-semibold tracking-[-0.02em]">Next steps</h2>
            <ul className="mt-4 space-y-2.5">
              {nextSteps.map(p => (
                <li key={p.slug} className="flex gap-3 text-[16.5px] leading-[1.7] text-[#2E3A33]">
                  <span aria-hidden className="mt-[11px] size-1.5 shrink-0 rounded-full bg-[#34C77B]" />
                  <span>
                    <Link href={docHref(p.slug)} className="font-medium text-[#0E7A4A] underline decoration-[#0E7A4A]/30 underline-offset-4 hover:decoration-[#0E7A4A]">{p.title}</Link>
                    {': '}{p.description.charAt(0).toLowerCase() + p.description.slice(1)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav aria-label="Previous and next pages" className="mt-16 grid gap-3 border-t border-black/[0.06] pt-8 sm:grid-cols-2">
          {prev ? (
            <Link href={docHref(prev.slug)} className="group rounded-2xl border border-black/[0.08] p-5 transition-colors hover:border-[#34C77B]/60">
              <span className="flex items-center gap-1.5 text-[13px] text-black/45"><ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden /> Previous</span>
              <span className="mt-1 block font-semibold text-[#0A1710]">{prev.title}</span>
              <span className="mt-1 line-clamp-2 block text-[14px] text-black/50">{prev.description}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={docHref(next.slug)} className="group rounded-2xl border border-black/[0.08] p-5 text-right transition-colors hover:border-[#34C77B]/60">
              <span className="flex items-center justify-end gap-1.5 text-[13px] text-black/45">Next <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
              <span className="mt-1 block font-semibold text-[#0A1710]">{next.title}</span>
              <span className="mt-1 line-clamp-2 block text-[14px] text-black/50">{next.description}</span>
            </Link>
          )}
        </nav>
      </article>

      {headings.length > 0 && (
        <aside className="sticky top-24 hidden h-fit w-[220px] shrink-0 xl:block">
          <Toc headings={headings} />
        </aside>
      )}
    </div>
  )
}
