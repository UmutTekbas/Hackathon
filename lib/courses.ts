export type Course = {
  slug: string;
  category: string;
  shortCategory: string;
  title: string;
  provider: string;
  description: string;
  youtubeId: string;
  playlistId?: string;
  accent: "signal" | "violet" | "coral" | "blue";
};

export const STREAM_RATE_PER_SECOND = "0.2";
export const STREAM_RATE_PER_MINUTE = "12";

export const courses: Course[] = [
  {
    slug: "mit-python",
    category: "Programming & Computer Science",
    shortCategory: "Computer Science",
    title: "MIT 6.100L Introduction to CS and Programming using Python",
    provider: "MIT OpenCourseWare",
    description: "Build computational thinking and Python fundamentals with MIT's introductory computer science course.",
    youtubeId: "xAcTmDO6NTI",
    playlistId: "PLUl4u3cNGP62A-ynp6v6-LGBCzeH3VAQB",
    accent: "signal"
  },
  {
    slug: "mit-microeconomics",
    category: "Finance & Economics",
    shortCategory: "Finance",
    title: "MIT 14.01 Principles of Microeconomics",
    provider: "MIT OpenCourseWare",
    description: "Learn how individuals and firms make decisions, and how markets allocate scarce resources.",
    youtubeId: "HdHlfiOAJyE",
    playlistId: "PLUl4u3cNGP63B2lDhyKOsImI7FjCf6eDW",
    accent: "violet"
  },
  {
    slug: "mit-biology",
    category: "Biology & Life Sciences",
    shortCategory: "Biology",
    title: "MIT Introductory Biology",
    provider: "MIT OpenCourseWare",
    description: "Explore molecular biology, genetics, cells, and the systems that make life possible.",
    youtubeId: "KlVHqq38KJU",
    playlistId: "PLUl4u3cNGP63LmSVIVzy584-ZbjbJ-Y63",
    accent: "coral"
  },
  {
    slug: "mit-human-brain",
    category: "Neuroscience",
    shortCategory: "Human Brain",
    title: "MIT 9.13 The Human Brain",
    provider: "MIT OpenCourseWare",
    description: "A systems-level tour of the human brain, cognition, perception, and neural organization.",
    youtubeId: "ba-HMvDn_vU",
    accent: "blue"
  }
];

export function getCourse(slug?: string | null) {
  return courses.find((course) => course.slug === slug);
}

export function findCourseBySessionTitle(title?: string) {
  if (!title) return undefined;
  const normalized = title.toLowerCase();
  return courses.find((course) => normalized.includes(course.title.toLowerCase()));
}

export function youtubeEmbedUrl(course: Course) {
  const playlist = course.playlistId ? `&list=${course.playlistId}` : "";
  return `https://www.youtube-nocookie.com/embed/${course.youtubeId}?autoplay=1&mute=1&rel=0${playlist}`;
}

export const depositPlans = [
  { amount: "2", feeBps: 1_000, label: "Starter" },
  { amount: "5", feeBps: 700, label: "Focus" },
  { amount: "10", feeBps: 500, label: "Deep dive" },
  { amount: "20", feeBps: 300, label: "Semester" }
] as const;
