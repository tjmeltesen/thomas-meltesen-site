import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { contactSchema, experienceSchema, projectsSchema } from '../../src/lib/schemas';
import * as content from '../../src/lib/content';
import { sortExperience } from '../../src/lib/content';
import badContact from '../fixtures/bad-contact.json';
import badExperience from '../fixtures/bad-experience.json';

describe('content model', () => {
  test('SRS-001 schema violations are rejected (build fails)', () => {
    expect(() => experienceSchema.parse(badExperience)).toThrow();
    expect(() => projectsSchema.parse([])).toThrow();
  });

  test('SRS-001 all seven content files exist and validate', () => {
    for (const k of ['profile', 'education', 'experience', 'projects', 'skills', 'hobbies', 'contact'] as const) {
      expect(content[k]).toBeTruthy();
    }
  });

  test('SRS-002 data files match the resume (checked once)', () => {
    expect(content.profile.name).toBe('Thomas Meltesen');
    expect(content.profile.headline).toBe('Aspiring AI/Agentic AI Engineer focused on Agent Orchestration & Agent Harness Systems');
    expect(content.profile.location).toBe('Iowa City, IA');
    expect(content.education.map((e) => e.degree)).toEqual(['M.S.', 'B.S.']);
    expect(content.education[1]!.highlights).toContain('GPA 3.85');
  });

  test('SRS-003 profile has a monogram fallback when photo is null', () => {
    expect(content.profile.photo).toBeNull();
    expect(content.profile.monogram).toBe('TM');
  });

  test('SRS-005 experience is sorted newest first in code, not file order', () => {
    const raw = JSON.parse(readFileSync('src/data/experience.json', 'utf8'));
    expect(raw[0].company).toBe('MMIT Business Solutions'); // file is deliberately out of order
    const sorted = sortExperience(raw);
    expect(sorted.map((x) => x.end)).toEqual(['2026-08', '2025-08', '2023-08']);
    expect(content.experience[0]!.role).toBe('Module Engineering Graduate Intern');
  });

  test('SRS-006 six projects, unique slugs, links optional', () => {
    expect(content.projects).toHaveLength(6);
    expect(new Set(content.projects.map((p) => p.slug)).size).toBe(6);
    expect(content.projects.filter((p) => p.link)).toHaveLength(3);
  });

  test('SRS-007 five skill groups', () => expect(content.skills).toHaveLength(5));

  test('SRS-008 three hobbies', () => {
    expect(content.hobbies.map((h) => h.name)).toEqual(['Basketball', 'Gaming', 'Hanging out with friends']);
  });

  test('SRS-009 contact schema has no phone field', () => {
    expect(() => contactSchema.parse(badContact)).toThrow(/phone|Unrecognized/);
    expect(Object.keys(contactSchema.shape)).not.toContain('phone');
    expect(JSON.stringify(content)).not.toMatch(/745|\(515\)/);
  });
});
