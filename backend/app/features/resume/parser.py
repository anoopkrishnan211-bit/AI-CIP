from io import BytesIO
from pathlib import Path

import fitz
from docx import Document


class UnsupportedDocumentError(ValueError):
    pass


def extract_text(file_name: str, content: bytes) -> str:
    suffix = Path(file_name).suffix.lower()
    if suffix == ".pdf":
        return _from_pdf(content)
    if suffix == ".docx":
        return _from_docx(content)
    if suffix == ".txt":
        return content.decode("utf-8", errors="replace")
    raise UnsupportedDocumentError("Only PDF, DOCX, and TXT resumes are supported.")


def _from_pdf(content: bytes) -> str:
    try:
        with fitz.open(stream=content, filetype="pdf") as document:
            return "\n".join(page.get_text("text") for page in document)
    except Exception as exc:
        raise UnsupportedDocumentError("This PDF could not be read.") from exc


def _from_docx(content: bytes) -> str:
    try:
        document = Document(BytesIO(content))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)
    except Exception as exc:
        raise UnsupportedDocumentError("This DOCX could not be read.") from exc

