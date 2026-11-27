# Maintenance

- Inspect current code, nearby conventions, and `git status --short` before editing.
  Preserve unrelated work, public exports, deep imports, signatures, protocol data,
  runtime requirements, and the existing UMD global. Keep the declaration baseline
  immutable; check bidirectional assignability with exact optional properties under
  TypeScript 6 and the TypeScript 4.9 consumer compiler. Prefer surgical fixes.
- Use pnpm 11.25.0 only. Import existing npm lockfiles with `pnpm import`; maintain
  one canonical pnpm lockfile per package, including standalone examples.
- Install with `pnpm install --frozen-lockfile --ignore-scripts`. Preserve the
  seven-day release age, trust policy, exotic-source blocking, integrity checks,
  and disabled lifecycle scripts in each `pnpm-workspace.yaml`. Never bypass
  protections, allow all builds, or execute remote installation scripts.
- Investigate audits with `pnpm audit --json`, `pnpm audit --prod --json`, and
  `pnpm why <package>`. Audit each standalone example too. Verify patched ranges,
  publication dates, ownership and upstream constraints against primary sources.
  Prefer compatible targeted updates; document every override and remaining finding.
- Never expose keys, mnemonics, tokens, environment files, or private local paths.
  Treat relay data, metadata and URLs as untrusted. Keep test data disposable;
  validate deletion targets and reject symlinks before recursive cleanup.
- Inspect scripts before running them. Run typecheck, focused tests, all builds,
  actual packed-consumer checks for CJS/ESM/browser/UMD/types, and standalone
  example validation. Run relay integration tests when network access is available;
  distinguish skipped checks from passing checks. Do not weaken tests or types.
- Keep code, comments and documentation in English. Update CHANGELOG.md for releases;
  preserve an empty Unreleased section and use patch bumps for compatible fixes.
- Obtain approval for source changes needed by dependency remediation and for major
  dependency/toolchain changes. Show exact Git and release wording for approval
  before commits, pushes, PRs or tags. Never publish without explicit authorization.
- Keep requester-facing implementation reports, audit transcripts, validation logs,
  session summaries and maintenance handoffs in chat. Never create or commit them
  in `docs/` or elsewhere in the repository unless explicitly requested. Project
  documentation must contain user-facing guidance; changelogs contain release notes.
- Use each project's existing test framework, discovery conventions, fixtures and
  lifecycle hooks for new tests. Include all added tests in the existing default
  test command and CI suite. Never introduce a parallel test runner, standalone
  test harness or separate opt-in suite unless explicitly requested. Child processes
  and browsers may be test fixtures, but the existing framework must own test cases,
  assertions, setup, teardown, timeouts and reporting.
