import os
import json
from typing import List, Dict, Any
from typing import List, Dict

from dotenv import load_dotenv
from groq import Groq

from .vector_store import get_vector_store

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def index_document(text: str, title: str, source: str) -> int:
    """
    Add a document to the vector store and return number of chunks indexed.
    """
    store = get_vector_store()
    metadata = {"title": title, "source": source}
    num_chunks = store.add_document(text=text, metadata=metadata)
    return num_chunks


def retrieve_relevant_chunks(query: str, k: int = 4) -> List[Dict[str, Any]]:
    """
    Retrieve top-k relevant chunks for a given query.
    """
    store = get_vector_store()
    results = store.search(query=query, k=k)
    return results


def build_context_from_chunks(chunks: List[Dict[str, Any]]) -> str:
    """
    Turn retrieved chunks into a single context string to feed an LLM.
    """
    parts = []
    for idx, c in enumerate(chunks):
        meta = c.get("metadata", {})
        title = meta.get("title", "Unknown document")
        chunk_id = meta.get("chunk_id", idx)
        parts.append(
            f"[Source: {title}, Chunk {chunk_id}]\n{c['content']}\n"
        )

    return "\n\n---\n\n".join(parts)



EXPLAIN_SYSTEM_PROMPT = """
You are MindMate AI, a helpful study assistant.

You will be given:
1) A QUESTION from the user.
2) CONTEXT from their own uploaded study documents.

Rules:
- Use ONLY the information in the CONTEXT to answer.
- If the answer is not clearly in the context, say so and invite the user to upload more notes.
- Explain in simple, student-friendly language.
- Stay concise but clear.
"""


def explain_with_llm(question: str, k: int = 4) -> Dict[str, Any]:
    """
    Use vector search to get relevant chunks, then have the LLM create
    a clean explanation based on those chunks.
    """
    chunks = retrieve_relevant_chunks(question, k=k)
    if not chunks:
        return {
            "question": question,
            "answer": (
                "I couldn't find any relevant information in your uploaded documents "
                "for this question. Try uploading more notes or a different file."
            ),
            "chunks": [],
        }

    context = build_context_from_chunks(chunks)

    user_prompt = f"""
                    QUESTION:
                    {question}

                    CONTEXT (from your notes):
                    {context}
                """

    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": EXPLAIN_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )

    answer_text = completion.choices[0].message.content

    return {
        "question": question,
        "answer": answer_text.strip(),
        "chunks": chunks,
    }


def simple_quiz_from_chunks(topic: str, num_questions: int = 5) -> Dict[str, Any]:
    chunks = retrieve_relevant_chunks(topic, k=num_questions)
    questions: List[Dict[str, Any]] = []

    if not chunks:
        return {
            "topic": topic,
            "questions": [],
        }

    for i, c in enumerate(chunks[:num_questions]):
        content = c["content"]
        snippet = content[:140].replace("\n", " ")
        q_text = f"According to your notes, what is an important idea about: {topic}?"
        correct = f"{snippet}..."
        options = [
            correct,
            "An unrelated statement.",
            "A generic definition not from your notes.",
            "None of the above.",
        ]

        questions.append(
            {
                "question": q_text,
                "options": options,
                "correct_index": 0,
                "explanation": "The first option is pulled directly from your uploaded document.",
            }
        )

    return {
        "topic": topic,
        "questions": questions,
    }


QUIZ_SYSTEM_PROMPT = """
You are MindMate AI, a study assistant.

You will be given:
1) A TOPIC that the user wants to be quizzed on.
2) CONTEXT from their uploaded study documents.

Your job is to create CLEAR, USEFUL multiple-choice questions.

Rules:
- Use ONLY the CONTEXT to create questions and answers.
- Each question must have 4 options (A, B, C, D).
- Make only ONE option clearly correct.
- Options must be non-overlapping and plausible.
- Explanations must briefly reference the context.
- Return ONLY valid JSON with this exact schema:

{
  "topic": "string",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_index": 0,
      "explanation": "string"
    }
  ]
}
"""


def quiz_with_llm(topic: str, num_questions: int = 5) -> Dict[str, Any]:
    """
    Use vector search to get relevant chunks, then have the LLM
    generate multiple-choice questions from those chunks.
    Falls back to simple_quiz_from_chunks if anything fails.
    """
    chunks = retrieve_relevant_chunks(topic, k=max(6, num_questions * 2))
    if not chunks:
        return {
            "topic": topic,
            "questions": [],
        }

    context = build_context_from_chunks(chunks)

    user_prompt = f"""
TOPIC:
{topic}

CONTEXT (from the user's notes):
{context}

Number of questions to generate: {num_questions}
"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",  # or llama-3.1-70b-versatile
            messages=[
                {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
        )

        raw = completion.choices[0].message.content
        data = json.loads(raw)

        # Basic validation / trimming
        questions = data.get("questions", [])[:num_questions]
        return {
            "topic": data.get("topic", topic),
            "questions": questions,
        }
    except Exception as e:
        # If the model returns non-JSON or anything breaks, fall back
        print("quiz_with_llm error, falling back to simple_quiz_from_chunks:", e)
        return simple_quiz_from_chunks(topic=topic, num_questions=num_questions)


def chat_with_knowledge_base(
    messages: List[Dict[str, str]],
    top_k: int = 4,
) -> Dict:
    """
    Simple chat helper that:
    - takes a list of messages [{role, content}]
    - finds the latest user question
    - retrieves top_k chunks from the vector store
    - calls the LLM using your existing pipeline
    Returns: {"reply": str, "chunks": [...]}.
    """

    from .vector_store import get_vector_store
    from .llm import call_llm  # adjust import if your helper name is different

    # 1) get last user message
    last_user_msg = None
    for m in reversed(messages):
        if m.get("role") == "user":
            last_user_msg = m.get("content", "").strip()
            break

    if not last_user_msg:
        return {"reply": "I didn't receive a question.", "chunks": []}

    store = get_vector_store()
    docs = store.similarity_search(last_user_msg, k=top_k)

    context_text = "\n\n".join(d.page_content for d in docs)
    sources = [
        {
            "content": d.page_content,
            "metadata": getattr(d, "metadata", {}),
        }
        for d in docs
    ]

    system_instructions = (
        "You are MindMate AI, a friendly study assistant. "
        "Use ONLY the provided context from the user's documents when answering. "
        "If the context is not enough, say that you don't have enough information "
        "instead of guessing.\n\n"
        "Context:\n"
        f"{context_text}\n\n"
    )

    # Build a single prompt from history for your existing text model
    history_str = ""
    for m in messages:
        role = m.get("role")
        content = m.get("content", "")
        if role == "user":
            history_str += f"Student: {content}\n"
        elif role == "assistant":
            history_str += f"Assistant: {content}\n"

    full_prompt = system_instructions + "Conversation so far:\n" + history_str + "\nAssistant:"

    reply_text = call_llm(full_prompt)

    return {
        "reply": reply_text,
        "chunks": sources,
    }

