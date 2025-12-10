# mindmate_app/services.py
import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

FLASHCARD_SYSTEM_PROMPT = """
You are MindMate AI, an expert study assistant.
Generate high-quality flashcards.

Output ONLY JSON in this format:
{
  "cards": [
    {"question": "...", "answer": "...", "tag": "..."}
  ]
}
"""

SUMMARY_SYSTEM_PROMPT = """
You are MindMate AI, a study summarizer.
Output ONLY JSON in this format:
{
  "summary": "...",
  "key_points": ["...", "..."]
}
"""

def generate_flashcards(topic, notes, difficulty, num_cards):
    prompt = f"""
Create {num_cards} flashcards.

Topic: {topic}
Difficulty: {difficulty}

Notes:
\"\"\"{notes}\"\"\"
"""

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": FLASHCARD_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )

    text = completion.choices[0].message.content

    data = json.loads(text)
    return data.get("cards", [])


def summarize_notes(notes, focus):
    prompt = f"""
Summarize these notes for: {focus or 'general understanding'}

Notes:
\"\"\"{notes}\"\"\"
"""

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )

    text = completion.choices[0].message.content
    data = json.loads(text)

    return {
        "summary": data.get("summary", ""),
        "key_points": data.get("key_points", []),
    }
