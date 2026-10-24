import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Bolt, ShieldCheck } from "@/components/icons";
import { SessionFeed } from "@/components/session-feed";
import { getCourse, STREAM_RATE_PER_SECOND } from "@/lib/courses";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  return (
    <main>
      <section className="grid-lines border-b border-line">
        <div className="shell grid min-h-[520px] items-center gap-12 py-16 lg:grid-cols-[1fr_.9fr]">
          <div>
            <p className="eyebrow">{course.category} · {course.provider}</p>
            <h1 className="mt-6 text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl">{course.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-mist">{course.description}</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#tutors" className="button-primary">Choose a tutor <ArrowUpRight/></a><Link href={`/create?course=${course.slug}`} className="button-secondary">Offer this class</Link></div>
          </div>
          <div className="panel overflow-hidden rounded-2xl">
            <div className="aspect-video grid place-items-center bg-black/70 p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-line bg-panel text-2xl">▶</span><p className="mt-5 font-semibold">Lecture locked</p><p className="mt-2 text-sm text-mist">Video starts when the payment stream starts.</p></div></div>
            <div className="grid grid-cols-2 gap-px bg-line"><div className="bg-panel p-5"><p className="text-xs uppercase tracking-wider text-mist">Stream rate</p><p className="mt-2 font-mono font-bold text-signal">{STREAM_RATE_PER_SECOND} MON/sec</p></div><div className="bg-panel p-5"><p className="text-xs uppercase tracking-wider text-mist">Minimum deposit</p><p className="mt-2 font-mono font-bold">2 MON</p></div></div>
          </div>
        </div>
      </section>

      <section id="tutors" className="shell py-20">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Available tutors</p><h2 className="mt-3 text-4xl font-black tracking-[-.045em]">Pick your stream</h2></div><div className="flex gap-5 text-xs text-mist"><span className="flex items-center gap-2"><ShieldCheck/> On-chain escrow</span><span className="flex items-center gap-2"><Bolt/> Per-second accrual</span></div></div>
        <SessionFeed courseSlug={course.slug}/>
        <div className="mt-8 rounded-xl border border-line bg-panel/70 p-5 text-sm leading-6 text-mist">No tutor listed yet? <Link href={`/create?course=${course.slug}`} className="font-semibold text-signal hover:underline">Create the first on-chain offer for this class.</Link></div>
      </section>
    </main>
  );
}
