# mindmate_app/rag/vector_store.py
from typing import List, Dict, Any
from pathlib import Path

from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import SentenceTransformerEmbeddings

# Where ChromaDB will store data (folder created automatically)
VECTOR_STORE_DIR = Path("mindmate_vector_store")


class MindMateVectorStore:
    """
    Wrapper around Chroma vector store for MindMate AI.
    Handles:
      - creating the store
      - adding documents
      - running similarity search
    """

    def __init__(self, persist_directory: str | None = None):
        if persist_directory is None:
            persist_directory = str(VECTOR_STORE_DIR)

        # Local embedding model, no API key needed
        self.embedding_model = SentenceTransformerEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )

        self.db = Chroma(
            persist_directory=persist_directory,
            embedding_function=self.embedding_model,
        )

        # Text splitter for chunking documents
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100,
        )

    def add_document(self, text: str, metadata: Dict[str, Any]) -> int:
        """
        Split the text into chunks, embed them, and store in Chroma.
        Returns number of chunks added.
        """
        chunks = self.splitter.split_text(text)
        metadatas = [metadata | {"chunk_id": i} for i in range(len(chunks))]

        self.db.add_texts(texts=chunks, metadatas=metadatas)
        self.db.persist()  # save to disk

        return len(chunks)

    def search(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        """
        Run similarity search and return top-k chunks with metadata.
        """
        docs = self.db.similarity_search(query, k=k)
        results = []
        for d in docs:
            results.append(
                {
                    "content": d.page_content,
                    "metadata": d.metadata,
                }
            )
        return results


# Singleton-like helper
_vector_store_instance: MindMateVectorStore | None = None


def get_vector_store() -> MindMateVectorStore:
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = MindMateVectorStore()
    return _vector_store_instance
