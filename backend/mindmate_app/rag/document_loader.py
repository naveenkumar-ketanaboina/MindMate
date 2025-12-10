# mindmate_app/rag/document_loader.py
from pathlib import Path
from typing import List
from pypdf import PdfReader


def load_pdf_text(file_path: str) -> str:
    """
    Read a PDF file from disk and return its full text.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")

    reader = PdfReader(str(path))
    text_parts: List[str] = []

    for page in reader.pages:
        page_text = page.extract_text() or ""
        text_parts.append(page_text)


    return "\n\n".join(text_parts)
