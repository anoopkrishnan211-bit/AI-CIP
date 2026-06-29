# Dependency inventory

## Required to run the MVP

| Area | Dependency | Why |
| --- | --- | --- |
| Runtime | Node.js 22+ and npm | Next.js development and build |
| Runtime | Python 3.12+ | FastAPI service and document parsing |
| Frontend | Next.js, React, TypeScript | UI framework and typed workflow |
| UI | Tailwind CSS, Lucide React, Framer Motion | Styling, icons, and restrained motion |
| Forms | React Hook Form, Zod | Browser-side validation |
| PDF | jsPDF | Local, privacy-preserving report download |
| API | FastAPI, Uvicorn, Pydantic Settings | Typed HTTP service and configuration |
| Uploads | python-multipart | Multipart form handling |
| Documents | PyMuPDF, python-docx | In-memory PDF and DOCX extraction |
| AI | OpenAI Python SDK | Structured report generation when enabled |
| Tests | Vitest, Testing Library, Pytest, HTTPX | Unit and API verification |
| Tooling | Docker, GitHub Actions | Reproducible deployment and CI |

## External configuration

- An OpenAI API key is optional. Without it, deterministic seminar mode covers the entire flow.
- Vercel and Render accounts are needed only for public deployment.
- The GitHub repository is the source of truth.

## Deliberately deferred

- `langgraph` and `langchain`: the MVP has a linear, request-scoped flow; adding orchestration now increases failure modes without adding user value.
- `spaCy`: skill detection is currently transparent and vocabulary-based. Add spaCy only when a measured extraction benchmark justifies the model download and cold-start cost.
- shadcn/ui CLI: the visual system is implemented as small local components. Individual Radix primitives can be added when accessibility behavior requires them.
- Redis, SQL, object storage, auth SDKs, analytics, and queues: prohibited by the stateless MVP boundary.

