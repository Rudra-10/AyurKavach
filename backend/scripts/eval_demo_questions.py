"""
Evaluation script to test retrieval and end-to-end answers against plan.md Section 10 demo questions.
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DEMO_QUESTIONS = [
    {
        "id": 1,
        "question": "Can I patent an Ayurvedic formulation using turmeric?",
        "jurisdiction": "india",
        "lang": "en"
    },
    {
        "id": 2,
        "question": "What approvals do I need before filing abroad for a formulation using Indian medicinal plants?",
        "jurisdiction": "both",
        "lang": "en"
    },
    {
        "id": 3,
        "question": "How do India and the EU differ on patentability of traditional herbal medicine?",
        "jurisdiction": "both",
        "lang": "en"
    },
    {
        "id": 4,
        "question": "Do I need ABS approval to export a herbal product?",
        "jurisdiction": "india",
        "lang": "en"
    },
    {
        "id": 5,
        "question": "How is my Ayurvedic formulation classified under the Drugs & Cosmetics Act?",
        "jurisdiction": "india",
        "lang": "en"
    },
    {
        "id": 6,
        "question": "क्या मैं हल्दी का उपयोग करके आयुर्वेदिक फॉर्मूलेशन का पेटेंट करा सकता हूँ?",
        "jurisdiction": "india",
        "lang": "hi"
    }
]


def main():
    print("Demo questions evaluation runner initialized.")
    for q in DEMO_QUESTIONS:
        print(f"[{q['id']}] {q['question']} (jurisdiction={q['jurisdiction']}, lang={q['lang']})")


if __name__ == "__main__":
    main()
