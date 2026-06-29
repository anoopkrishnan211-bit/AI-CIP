# ANIRA development guidance

Read `ARCHITECTURE.md` before changing product behavior or public contracts.

The implementation may recommend product changes but must not silently add, remove, or redefine features. Keep the MVP session-only: no authentication, database, analytics, or background persistence.

Before handing off a change:

1. Run the most relevant unit tests.
2. Run `npm.cmd run build` for frontend changes.
3. Update architecture or dependency docs when contracts change.
4. Never commit secrets, uploaded resumes, generated reports, or local environment files.

