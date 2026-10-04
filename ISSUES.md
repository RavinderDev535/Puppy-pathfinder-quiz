# Puppy Pathfinder Quiz — Issues & Production Readiness Report

> Audit date: 2026-04-23
> Scope: full frontend review of `puppy-pathfinder-quiz-main` (React + Vite + TypeScript SPA).
> Legend: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low

---

## 1. Broken / Incorrect

| # | Issue | Location | Severity |
|---|---|---|---|
| 1.1 | `VITE_API_URL` is declared in `.env.example` but **never read**. Backend URL is hardcoded, so switching envs requires a redeploy. | `src/lib/backend-api.ts:5`, `src/lib/quiz-api.ts:9`, `.env.example` | 🔴 |
| 1.2 | **All Shopify URLs point to the staging store** (`ezwhelp-quiz-staging.myshopify.com`). Real customers will be routed to staging. | `src/components/EZWhelpQuiz.tsx:99–141`, `src/lib/structural-engine.ts:54–63`, `src/lib/lifecycle-engine.ts:18–52` | 🔴 |
| 1.3 | Two different hardcoded base URLs in parallel API modules → drift risk. | `src/lib/backend-api.ts:5` vs `src/lib/quiz-api.ts:9` | 🟠 |
| 1.4 | Dead component — `NavLink.tsx` is defined but imported nowhere. | `src/components/NavLink.tsx` | 🟢 |
| 1.5 | Dead function — `generateRecommendations()` declared but never called. | `src/lib/quiz-api.ts:79` | 🟢 |
| 1.6 | Session `attempt_id` lives in a module-level `let`; lost on page reload and unsafe under SSR / concurrent tests. | `src/lib/quiz-tracking.ts:18–19` | 🟠 |
| 1.7 | Mute flag also stored in a module-level `let` — same SSR / test-isolation problem. | `src/lib/sounds.ts:7–8` | 🟡 |
| 1.8 | **Both `bun.lockb` and `package-lock.json` are committed.** Mixed package managers → non-reproducible installs. | repo root | 🟠 |
| 1.9 | Node version not pinned — no `.nvmrc` and no `engines` field in `package.json`. | `package.json` | 🟡 |

---

## 2. Unsafe / Security

| # | Issue | Location | Severity |
|---|---|---|---|
| 2.1 | TypeScript strictness disabled: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals/Parameters: false`. Masks real bugs. | `tsconfig.json:4–6` | 🔴 |
| 2.2 | `any` casts scattered through the quiz state machine (`(newData as any)[stepId]`, `value as any`). | `src/components/EZWhelpQuiz.tsx` (~line 950+) | 🟠 |
| 2.3 | `any`-typed predicates in quiz config types. | `src/lib/types.ts:92`, `src/lib/quiz-config.ts:37,42` | 🟡 |
| 2.4 | **XSS risk**: backend-returned `product.url` is rendered into `<a href={...}>` without validation. A `javascript:` URL would execute. | Path 2 results in `src/components/EZWhelpQuiz.tsx` (~1500–1540) | 🟠 |
| 2.5 | `localStorage.getItem()` unguarded — throws in Safari private mode / SSR. | `src/lib/sounds.ts:7` | 🟡 |
| 2.6 | **No input validation**. Zod is a dependency but no schemas are used; email is POSTed with no format check. | form submission paths in `EZWhelpQuiz.tsx` | 🟠 |
| 2.7 | Silent `catch {}` hides Web Audio failures, making regressions invisible. | `src/lib/sounds.ts:33, 67, …` | 🟡 |
| 2.8 | API error paths `console.error` but show no retry / recovery affordance. | `src/lib/backend-api.ts:42–49`, `src/components/EZWhelpQuiz.tsx:~1000` | 🟠 |
| 2.9 | No CSP / `Referrer-Policy` / `Permissions-Policy` / SRI defined. | `index.html` | 🟡 |
| 2.10 | No client-side rate-limit / backoff — spamming submit fires unbounded requests. | submission handlers in `EZWhelpQuiz.tsx` | 🟡 |
| 2.11 | No captcha / honeypot on the email field — scrapeable. | quiz results email capture | 🟡 |
| 2.12 | No GDPR / CCPA consent before tracking beacons (`quiz-tracking.ts`) fire. | `src/lib/quiz-tracking.ts` | 🟠 |

---

## 3. Messy / Maintainability

| # | Issue | Location | Severity |
|---|---|---|---|
| 3.1 | **`EZWhelpQuiz.tsx` is 1,792 lines** holding both paths, rendering, API calls, Shopify URL maps, and slide logic. Hard to test and evolve. | `src/components/EZWhelpQuiz.tsx` | 🔴 |
| 3.2 | Two overlapping API modules duplicate base URL + fetch logic. | `backend-api.ts` + `quiz-api.ts` | 🟠 |
| 3.3 | Bundle → variant → image URL maps are inlined in the component instead of a `shopify-config.ts`. | `EZWhelpQuiz.tsx:99–141` | 🟠 |
| 3.4 | `lib/` flat-mixes HTTP clients, recommendation engines, and data tables. | `src/lib/*` | 🟡 |
| 3.5 | Raw `console.error` scattered through production code; no structured logger. | `backend-api.ts`, `quiz-api.ts`, `EZWhelpQuiz.tsx` | 🟡 |
| 3.6 | No JSDoc on engine functions that encode real business rules. | all `src/lib/*-engine.ts` | 🟢 |
| 3.7 | README is minimal — no architecture doc, no CONTRIBUTING, no CHANGELOG. | `README.md` | 🟡 |
| 3.8 | No commit convention / Husky / lint-staged hook. | repo root | 🟢 |

---

## 4. Not Covered for Production

### 4.1 Infrastructure & Deployment
- No CI pipeline (GitHub Actions) running `tsc --noEmit`, `eslint`, `vitest --run`.
- No `Dockerfile`, no `vercel.json`, no deployment manifest.
- No runtime env-var validation (e.g. envalid / zod-env) — app boots even if `VITE_API_URL` is missing.
- `.env` not explicitly listed in `.gitignore`.
- Conflicting lockfiles (`bun.lockb` + `package-lock.json`).

### 4.2 Observability
- No Sentry (or equivalent) error-tracking SDK.
- No product analytics (PostHog / GA4 / Plausible) — only the in-house fire-and-forget tracker.
- No Web Vitals / performance reporting.
- No structured logs; no request correlation to `attempt_id`.

### 4.3 Security
- No CSP, `Permissions-Policy`, or `Referrer-Policy`.
- No sanitization of backend-supplied URLs before render.
- No captcha / honeypot on submit.
- No cookie-consent UI; tracking fires unconditionally.
- No privacy policy / ToS link.

### 4.4 Performance
- No route-level code splitting (`React.lazy` + `Suspense`); single bundle contains the whole quiz.
- ~15 MB of assets in `src/assets/` loaded eagerly — no `loading="lazy"`, no responsive `srcset`, no WebP/AVIF.
- Mascot video autoplays without `preload="metadata"`.
- Framer Motion animations ignore `prefers-reduced-motion`.
- No bundle-size budget in CI; no `manualChunks` for the 60+ shadcn UI files.

### 4.5 Accessibility
- No ARIA labels on radio-style option buttons; not marked up as `role="radiogroup"`.
- No focus management when steps advance or the results view opens.
- No `aria-live` region for step transitions / async results.
- Color-only cues for selected state on the clay-pastel palette; contrast likely sub-AA in places.
- SFX can play without explicit user opt-in — should be off by default.
- No `prefers-reduced-motion` handling.

### 4.6 SEO
- Meta tags present in `index.html`, but no sitemap, no `robots.txt` rules beyond default.
- No JSON-LD structured data despite being a product-recommendation tool.
- Preview cards depend solely on static `<meta>` in `index.html` — no per-route override.

### 4.7 Testing
- Good logic-layer coverage (`~60KB` across `path1-bundle-routing`, `path2-lifecycle`, `addon-suggestions`, `breed-box-sizes`, `confidence-engine`).
- **Zero** component, integration, or E2E tests (no Playwright / Cypress).
- No test asserting Shopify URL maps match real storefront variants.
- No coverage reporting / thresholds.
- No visual regression / snapshot testing of the results screen.

### 4.8 Resilience & UX
- API errors show no retry button and no offline handling.
- No service worker / PWA manifest.
- No skeleton loaders during backend calls.
- No "resume where you left off" — refresh wipes the quiz.
- No duplicate-submission guard.
- No email format validation.

### 4.9 i18n / Content
- All copy is hardcoded English; no i18n framework.
- No per-route `lang` attribute handling.

---

## 5. Priority Fix List

Ordered so each step unlocks the next.

| # | Fix | Why | Rough effort |
|---|---|---|---|
| 1 | Config-driven URLs: move the backend base URL and every Shopify URL into env vars + a single `shopify-config.ts`. Point to the **production** store. | Resolves 1.1, 1.2, 1.3, 3.3. Blocks real launch. | S |
| 2 | Re-enable TS strictness (`strict: true`) and remove `as any` casts. | Resolves 2.1, 2.2, 2.3 and surfaces hidden bugs. | M |
| 3 | Validate outbound `product.url` with `new URL()` + `https:` allowlist before render. | Resolves 2.4. | S |
| 4 | Split `EZWhelpQuiz.tsx` into `GateStep`, `NewCustomerFlow`, `ExistingCustomerFlow`, `ResultsView` + a `useQuizState` hook. | Resolves 3.1 and unlocks component/E2E tests. | L |
| 5 | Collapse `backend-api.ts` + `quiz-api.ts` into one `api/` module with a typed `fetchJson` helper, retries + backoff, and a single error surface. | Resolves 3.2, 2.8, 2.10. | M |
| 6 | Zod-validate the email form and all API request/response shapes. | Resolves 2.6. | S |
| 7 | Persist quiz state in `sessionStorage` keyed by `attempt_id`. | Resolves 1.6, 4.8 "resume". | S |
| 8 | Add CI: `tsc --noEmit`, `eslint`, `vitest --run`, plus a Playwright smoke per path. | Resolves 4.1, 4.7. | M |
| 9 | Wire Sentry (with source maps) and a real analytics provider behind a cookie-consent gate. | Resolves 4.2, 2.12. | M |
| 10 | Accessibility pass: `role="radiogroup"`, focus management, `aria-live`, `prefers-reduced-motion`, audio off by default, labeled inputs. | Resolves 4.5. | M |
| 11 | Performance: route/code splitting, lazy + responsive images, WebP, `manualChunks` for shadcn. | Resolves 4.4. | M |
| 12 | Drop one lockfile, pin Node in `engines` / `.nvmrc`, add a `Dockerfile` or `vercel.json`. | Resolves 1.8, 1.9, 4.1 deployment gaps. | S |

---

## 6. Quick Reference — File Hotspots

| Area | Files |
|---|---|
| Env / URLs | `.env.example`, `src/lib/backend-api.ts`, `src/lib/quiz-api.ts`, `src/lib/structural-engine.ts`, `src/lib/lifecycle-engine.ts`, `src/components/EZWhelpQuiz.tsx` |
| Type safety | `tsconfig.json`, `src/lib/types.ts`, `src/lib/quiz-config.ts`, `src/components/EZWhelpQuiz.tsx` |
| Security | `src/components/EZWhelpQuiz.tsx` (Path 2 results), `src/lib/sounds.ts`, `index.html`, `src/lib/quiz-tracking.ts` |
| Monolith | `src/components/EZWhelpQuiz.tsx` |
| Missing infra | repo root (no CI/Docker/vercel), `package.json` |

