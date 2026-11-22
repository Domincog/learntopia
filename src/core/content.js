/**
 * Content access. The catalog (course metadata) is loaded up front; each
 * lesson's steps live in their own module and are fetched on demand:
 *
 *   content/index.js                          catalog: categories + course list
 *   content/courses/<course>/course.js        course metadata + lesson list
 *   content/courses/<course>/lessons/<id>.js  one lesson (steps + recap)
 */
import { categories, courses, paths } from '../../content/index.js';
import { normalizeLesson } from '../player/normalize.js';

const courseMap = new Map(courses.map((c) => [c.id, c]));
const lessonCache = new Map();

export const getCategories = () => categories;
export const getCategory = (id) => categories.find((c) => c.id === id) || null;
export const getCourses = () => courses;
export const getCourse = (id) => courseMap.get(id) || null;

/** Flat list of a course's lessons with chapter info and running index. */
export function lessonsOf(course) {
  const out = [];
  course.chapters.forEach((chapter, ci) => {
    chapter.lessons.forEach((lesson) => {
      out.push({ ...lesson, chapterIndex: ci, chapterTitle: chapter.title, index: out.length });
    });
  });
  return out;
}

export function lessonMeta(courseId, lessonId) {
  const course = getCourse(courseId);
  if (!course) return null;
  return lessonsOf(course).find((l) => l.id === lessonId) || null;
}

export function nextLessonAfter(courseId, lessonId) {
  const course = getCourse(courseId);
  if (!course) return null;
  const list = lessonsOf(course);
  const idx = list.findIndex((l) => l.id === lessonId);
  return idx >= 0 && idx + 1 < list.length ? list[idx + 1] : null;
}

export function countLessons(course) {
  return course.chapters.reduce((n, ch) => n + ch.lessons.length, 0);
}

export function courseMinutes(course) {
  return course.chapters.reduce((n, ch) => n + ch.lessons.reduce((m, l) => m + (l.minutes || 8), 0), 0);
}

/**
 * Load and normalise one lesson. Resolves to { id, steps, recap, courseId }.
 * Rejects if the lesson module is missing or malformed.
 */
export function loadLesson(courseId, lessonId) {
  const key = `${courseId}/${lessonId}`;
  if (lessonCache.has(key)) return lessonCache.get(key);
  const promise = import(`../../content/courses/${courseId}/lessons/${lessonId}.js`)
    .then((mod) => normalizeLesson(mod.default, courseId, lessonId))
    .catch((err) => {
      lessonCache.delete(key);
      throw err;
    });
  lessonCache.set(key, promise);
  return promise;
}

/** Find the step a review card points at. Resolves to null if it no longer exists. */
export async function loadCardStep(cardId) {
  const [courseId, lessonId, ...rest] = cardId.split('/');
  const stepId = rest.join('/');
  const course = getCourse(courseId);
  const meta = lessonMeta(courseId, lessonId);
  if (!course || !meta) return null;
  try {
    const lesson = await loadLesson(courseId, lessonId);
    const step = lesson.steps.find((s) => s.id === stepId);
    if (!step || !step.review) return null;
    return { step, course, lesson: meta, cardId };
  } catch (err) {
    console.warn('[content] could not load', cardId, err);
    return null;
  }
}

/* ---------------------------------------------------------- learning paths */

/** Paths string courses together from beginner to advanced (see content/index.js). */
export const getPaths = () => paths || [];

/**
 * Where a course sits in its learning path:
 * { path, index, total, prev, next } (prev and next are courses or null), or null when it is in no path.
 */
export function pathOf(courseId) {
  for (const path of getPaths()) {
    const index = path.courses.indexOf(courseId);
    if (index < 0) continue;
    return {
      path,
      index,
      total: path.courses.length,
      prev: index > 0 ? getCourse(path.courses[index - 1]) : null,
      next: index + 1 < path.courses.length ? getCourse(path.courses[index + 1]) : null,
    };
  }
  return null;
}

/** The courses a course builds on (its `requires` list), as course objects. */
export const prerequisitesOf = (course) => ((course && course.requires) || []).map(getCourse).filter(Boolean);

/** What to take after a course: the next one in its path, if there is one. */
export function nextCourseAfter(courseId) {
  const place = pathOf(courseId);
  return place ? place.next : null;
}

/** Everything in one list, for search and stats. */
export function allLessons() {
  const out = [];
  for (const course of courses) for (const l of lessonsOf(course)) out.push({ course, lesson: l });
  return out;
}
