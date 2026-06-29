import type { CareerReport, ReportRequest, ResumeAnalysis } from "@/types/career";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Something went wrong. Please try again.");
  }
  return response.json() as Promise<T>;
}

export async function analyzeResume(file: File): Promise<ResumeAnalysis> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/api/v1/resumes/analyze`, {
    method: "POST",
    body,
  });
  return parseResponse<ResumeAnalysis>(response);
}

export async function generateReport(
  request: ReportRequest,
): Promise<CareerReport> {
  const response = await fetch(`${API_URL}/api/v1/reports/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return parseResponse<CareerReport>(response);
}

