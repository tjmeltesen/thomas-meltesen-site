import profileRaw from '../data/profile.json';
import educationRaw from '../data/education.json';
import experienceRaw from '../data/experience.json';
import projectsRaw from '../data/projects.json';
import skillsRaw from '../data/skills.json';
import hobbiesRaw from '../data/hobbies.json';
import contactRaw from '../data/contact.json';
import {
  profileSchema, educationSchema, experienceSchema, projectsSchema,
  skillsSchema, hobbiesSchema, contactSchema, type Experience,
} from './schemas';

/** SRS-005: sort newest first in code, regardless of file order. */
export function sortExperience(list: Experience[]): Experience[] {
  return [...list].sort((a, b) => b.end.localeCompare(a.end) || b.start.localeCompare(a.start));
}

// .parse() throws on any violation, which fails `astro build` (SRS-001).
export const profile = profileSchema.parse(profileRaw);
export const education = educationSchema.parse(educationRaw);
export const experience = sortExperience(experienceSchema.parse(experienceRaw));
export const projects = projectsSchema.parse(projectsRaw);
export const skills = skillsSchema.parse(skillsRaw);
export const hobbies = hobbiesSchema.parse(hobbiesRaw);
export const contact = contactSchema.parse(contactRaw);
