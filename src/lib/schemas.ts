import { z } from 'zod';

/** SRS-001: every content file is validated against these schemas at build time. */
const ym = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM');
const url = z.string().url();

export const profileSchema = z
  .object({
    name: z.string().min(1),
    headline: z.string().min(1),
    location: z.string().min(1),
    bio: z.string().min(1),
    intro: z.string().min(1),
    /** Path relative to src/assets, or null to show the monogram (SRS-003). */
    photo: z.string().nullable(),
    monogram: z.string().min(1).max(3),
  })
  .strict();

export const educationSchema = z.array(
  z
    .object({
      school: z.string(),
      degree: z.string(),
      field: z.string(),
      period: z.string(),
      highlights: z.array(z.string()),
    })
    .strict(),
);

export const experienceSchema = z.array(
  z
    .object({
      company: z.string(),
      role: z.string(),
      location: z.string(),
      start: ym,
      end: ym,
      highlights: z.array(z.string()).min(1),
    })
    .strict(),
);

export const projectSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(),
    kicker: z.string(),
    summary: z.string(),
    overview: z.string(),
    role: z.string(),
    tags: z.array(z.string()).min(1),
    outcomes: z.array(z.string()).min(1),
    link: url.optional(),
    accent: z.enum(['blue', 'purple', 'teal', 'orange', 'pink', 'green']),
  })
  .strict();
export const projectsSchema = z.array(projectSchema).length(6);

export const skillsSchema = z.array(
  z.object({ group: z.string(), items: z.array(z.string()).min(1) }).strict(),
);

export const hobbiesSchema = z.array(
  z.object({ name: z.string(), icon: z.enum(['basketball', 'gaming', 'friends']), blurb: z.string() }).strict(),
);

/** SRS-009: strict object, so a `phone` field is a schema violation. */
export const contactSchema = z
  .object({
    emailUser: z.string(),
    emailDomain: z.string(),
    linkedin: url,
    github: url,
  })
  .strict();

export type Profile = z.infer<typeof profileSchema>;
export type Experience = z.infer<typeof experienceSchema>[number];
export type Project = z.infer<typeof projectSchema>;
