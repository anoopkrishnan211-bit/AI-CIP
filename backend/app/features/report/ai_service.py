import json
from pathlib import Path

from openai import OpenAI

from app.schemas.career import AIReportNarrative, CareerReport


class AIReportService:
    """Enriches narrative while preserving engine scores, evidence, and rankings."""

    def __init__(self, api_key: str, model: str) -> None:
        self._client = OpenAI(api_key=api_key)
        self._model = model
        prompt_path = Path(__file__).parents[3] / "prompts" / "report-agent.md"
        self._prompt = prompt_path.read_text(encoding="utf-8")

    def enrich(self, report: CareerReport) -> CareerReport:
        response = self._client.responses.parse(
            model=self._model,
            input=[
                {"role": "system", "content": self._prompt},
                {
                    "role": "user",
                    "content": json.dumps(
                        report.model_dump(by_alias=True),
                        ensure_ascii=False,
                    ),
                },
            ],
            text_format=AIReportNarrative,
        )
        narrative = response.output_parsed
        if narrative is None:
            raise RuntimeError("The AI service returned no structured narrative.")
        return report.model_copy(
            update={
                "headline": narrative.headline,
                "summary": narrative.summary,
                "mode": "ai",
            }
        )

