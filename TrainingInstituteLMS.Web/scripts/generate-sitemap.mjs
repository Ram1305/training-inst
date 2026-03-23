/**
 * Writes public/sitemap.xml: static public routes (see App.tsx) plus /course/{id}/{slug}
 * from GET {SITEMAP_API_BASE}/course/active. Mirrors courseNameToSlug in App.tsx.
 *
 * Env: SITEMAP_SITE_URL (default https://safetytrainingacademy.edu.au)
 *      SITEMAP_API_BASE (default production API + /api)
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_SITE = 'https://safetytrainingacademy.edu.au';
const DEFAULT_API_BASE =
  'https://safety-academy-api-afh9eua2ctege9bz.australiasoutheast-01.azurewebsites.net/api';

const siteUrl = (process.env.SITEMAP_SITE_URL || DEFAULT_SITE).replace(/\/$/, '');
const apiBase = (process.env.SITEMAP_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');

/** Same rules as courseNameToSlug in src/App.tsx */
function courseNameToSlug(name) {
  const s = (name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'course';
}

const STATIC_PATHS = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/book-now', changefreq: 'monthly', priority: '0.9' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/enroll', changefreq: 'weekly', priority: '0.9' },
  { path: '/fees-refund', changefreq: 'yearly', priority: '0.5' },
  { path: '/forms', changefreq: 'monthly', priority: '0.6' },
  { path: '/gallery', changefreq: 'monthly', priority: '0.6' },
  { path: '/login', changefreq: 'monthly', priority: '0.4' },
  { path: '/quiz', changefreq: 'monthly', priority: '0.5' },
  { path: '/register', changefreq: 'monthly', priority: '0.7' },
  { path: '/voc', changefreq: 'monthly', priority: '0.6' },
];

function urlEntry(loc, changefreq, priority, lastmod) {
  let block = `  <url>\n    <loc>${loc}</loc>\n`;
  if (lastmod) block += `    <lastmod>${lastmod}</lastmod>\n`;
  if (changefreq) block += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority) block += `    <priority>${priority}</priority>\n`;
  block += `  </url>\n`;
  return block;
}

async function fetchAllActiveCourses() {
  const pageSize = 100;
  const all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${apiBase}/course/active?page=${page}&pageSize=${pageSize}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'API returned unsuccessful response');
    }
    const { courses = [], totalPages: tp = 1 } = json.data;
    all.push(...courses);
    totalPages = typeof tp === 'number' && tp >= 1 ? tp : 1;
    page += 1;
  } while (page <= totalPages);

  return all;
}

function buildXml(courseRows, lastmod) {
  let body = '<?xml version="1.0" encoding="UTF-8"?>\n';
  body += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const { path, changefreq, priority } of STATIC_PATHS) {
    const loc = path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`;
    body += urlEntry(loc, changefreq, priority, lastmod);
  }

  for (const c of courseRows) {
    const id = c.courseId ?? c.CourseId;
    const name = c.courseName ?? c.CourseName ?? '';
    if (!id) continue;
    const slug = courseNameToSlug(name);
    const loc = `${siteUrl}/course/${id}/${slug}`;
    body += urlEntry(loc, 'weekly', '0.85', lastmod);
  }

  body += '</urlset>\n';
  return body;
}

const lastmod = new Date().toISOString().slice(0, 10);
const outPath = join(__dirname, '..', 'public', 'sitemap.xml');

try {
  const courses = await fetchAllActiveCourses();
  writeFileSync(outPath, buildXml(courses, lastmod), 'utf8');
  console.log(`sitemap: wrote ${outPath} (${STATIC_PATHS.length} static + ${courses.length} course URLs)`);
} catch (err) {
  console.warn('sitemap: could not fetch courses, writing static URLs only:', err.message || err);
  writeFileSync(outPath, buildXml([], lastmod), 'utf8');
  console.log(`sitemap: wrote ${outPath} (${STATIC_PATHS.length} static URLs only)`);
}
