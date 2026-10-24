import Link from "next/link";
import { courses, STREAM_RATE_PER_SECOND } from "@/lib/courses";
import { ArrowUpRight } from "./icons";

const accentClasses = {
  signal: "border-signal/35 text-signal",
  violet: "border-violet/35 text-violet",
  coral: "border-coral/35 text-coral",
  blue: "border-sky-400/35 text-sky-300"
} as const;

export function CourseCatalog() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {courses.map((course, index) => (
        <Link key={course.slug} href={`/course/${course.slug}`} className="group panel relative min-h-[270px] overflow-hidden rounded-2xl p-6 transition-transform hover:-translate-y-1 sm:p-7">
          <div className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[.14em] ${accentClasses[course.accent]}`}>{course.shortCategory}</div>
          <p className="mt-8 font-mono text-xs text-mist">CLASS {String(index + 1).padStart(2, "0")} · {course.provider}</p>
          <h3 className="mt-3 max-w-lg text-2xl font-black leading-tight tracking-[-.035em]">{course.title}</h3>
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-mist">{course.description}</p>
          <div className="mt-7 flex items-center justify-between border-t border-line pt-5"><span className="font-mono text-sm text-signal">{STREAM_RATE_PER_SECOND} MON / sec</span><span className="text-mist transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"><ArrowUpRight/></span></div>
        </Link>
      ))}
    </div>
  );
}
