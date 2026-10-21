# HelioDesk assessment submission

A full-stack customer support ticket platform for the Tenx assessment.

## Review links
- [Public repository](https://github.com/Shayaan9559/tenx-heliodesk-assessment)
- [Live application](https://tenx-heliodesk-assessment.vercel.app)
- [API health](https://tenx-heliodesk-assessment.vercel.app/api/health)
- [Illustrated project walkthrough](HelioDesk-Assessment-Walkthrough.pdf)

The frontend and Flask API share the application domain. Source, application and walkthrough access were verified without login during the final audit on 20 October 2026.

## Included deliverables
- [README](../README.md): prerequisites, setup, seed/reset, run/test commands, architecture, configuration, deployment, limitations and AI usage.
- [Final brief compliance map](compliance.md).
- [Specification](spec.md), [API contract](api.md), [implementation plan](plan.md), [task mapping](tasks.md) and [verification evidence](verification.md).
- Flask source and isolated database tests in `backend/app` and `backend/tests`.
- React source and behavior tests in `frontend/src`.
- Dependency manifests, deterministic 12-ticket seed and placeholder-only `.env.example`.
- Recorded optional [end-to-end persistence test](../frontend/e2e/ticket-persistence.spec.ts), [video](evidence/e2e-persistence.webm) and [result](evidence/e2e-result.json).

## Final verification
**31 automated tests passed:** 17 backend, 13 frontend and one real-browser E2E. Strict TypeScript/Vite production build passed. A fresh checkout with newly installed dependencies verified the documented SQLite setup and seed/reset procedures. Hosted query/validation/persistence checks, public reviewer access and Chrome desktop/320px keyboard checks passed. [Final audit](evidence/final-audit.json).

## Engineering trade-off
React and Flask are deployed together to simplify integration and avoid unnecessary cross-origin configuration. SQLite provides reproducible local development and assessment testing; Supabase Postgres provides durable hosted storage on Vercel. Saves use server-confirmed responses for predictable error handling.

## Scope and limitations
Authentication and ticket creation are outside the required scope. Data is synthetic. Manual checks focus on Chrome, with one desktop Chromium E2E; full cross-browser, screen-reader, load and security audits are not claimed. Free hosted services can cold-start. The repository documents the hosted/local database distinction and known demo-history details.

This is the final technical submission index. Personalized correspondence and the candidate's reported effort are supplied in the submission email rather than published here.
