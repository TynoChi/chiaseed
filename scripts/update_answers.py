import json

# Define the answers
answers = {
    "ARF-PileS1-01": {"correctOptions": [1]},
    "ARF-PileS1-02": {"subQuestions": [1, 0, 0]},
    "ARF-PileS1-03": {"subQuestions": [1, 1, 1]},
    "ARF-PileS1-04": {"correctOptions": [1, 2, 3]},
    "ARF-PileS1-05": {"subQuestions": [2, 1]},
    "ARF-PileS1-06": {"subQuestions": [0, 0, 1]},
    "ARF-PileS1-07": {"subQuestions": [1, 0, 0]},
    "ARF-PileS1-08": {"correctOptions": [0]},
    "ARF-PileS1-09": {"correctOptions": [0, 2, 3]},
    "ARF-PileS1-10": {"subQuestions": [2, 2]},
    "ARF-PileS1-11": {"subQuestions": [0, 1, 0]},
    "ARF-PileS1-12": {"subQuestions": [2, 0]},
    "ARF-PileS1-13": {"subQuestions": [0, 1, 0]},
    "ARF-PileS1-14": {"correctOptions": [1, 2]},
    "ARF-PileS1-15": {"subQuestions": [1, 0, 1]},
    "ARF-PileS1-16": {"correctOptions": [1, 2, 3]},
    "ARF-PileS1-17": {"correctOptions": [0, 1, 2]},
    "ARF-PileS1-18": {"correctOptions": [1, 2, 3]},
    "ARF-PileS1-19": {"subQuestions": [0, 0]},
    "ARF-PileS1-20": {"subQuestions": [1, 1, 1]},
    "ARF-PileS1-21": {"correctOptions": [0]},
    "ARF-PileS1-22": {"correctOptions": [2]},
    "ARF-PileS1-23": {"subQuestions": [1, 0, 0]},
    "ARF-PileS1-24": {"correctOptions": [2, 3, 4]},
    "ARF-PileS1-25": {"subQuestions": [2, 1, 0]},
    "ARF-PileS1-26": {"subQuestions": [2, 1, 0]},
    "ARF-PileS1-27": {"correctOptions": [2]},
    "ARF-PileS1-28": {"correctOptions": [3]},
    "ARF-PileS1-29": {"correctOptions": [1, 2]},
    "ARF-PileS1-30": {"correctOptions": [0, 3]},
    "ARF-PileS1-31": {"correctOptions": [0, 3]},
    "ARF-PileS1-32": {"subQuestions": [2, 1]},
    "ARF-PileS1-33": {"subQuestions": [0, 0, 1]},
    "ARF-PileS2-01": {"correctOptions": [0, 1]},
    "ARF-PileS2-02": {"correctOptions": [1, 2]},
    "ARF-PileS2-03": {"correctOptions": [1]},
    "ARF-PileS2-04": {"subQuestions": [0, 1]},
    "ARF-PileS2-05": {"correctOptions": [2]},
    "ARF-PileS2-06": {"correctOptions": [1, 2]},
    "ARF-PileS2-07": {"subQuestions": [1, 0, 0]},
    "ARF-PileS2-08": {"correctOptions": [1, 2, 3]},
    "ARF-PileS2-09": {"correctOptions": [0, 1, 2]},
    "ARF-PileS2-10": {"correctOptions": [1]},
    "ARF-PileS2-11": {"correctOptions": [3]},
    "ARF-PileS2-12": {"subQuestions": [0, 0, 0]},
    "ARF-PileS2-13": {"subQuestions": [0, 1, 1]},
    "ARF-PileS2-14": {"subQuestions": [1, 0, 0]},
    "ARF-PileS2-15": {"subQuestions": [1, 0, 1]},
    "ARF-PileS2-16": {"correctOptions": [0, 2, 3]},
    "ARF-PileS2-17": {"correctOptions": [1]},
    "ARF-PileS2-18": {"correctOptions": [3]},
    "ARF-PileS2-19": {"correctOptions": [2]},
    "ARF-PileS2-20": {"correctOptions": [0]},
    "ARF-PileS2-21": {"correctOptions": [0, 1, 3]},
    "ARF-PileS2-22": {"correctOptions": [1, 2]},
    "ARF-PileS2-23": {"correctOptions": [3]},
    "ARF-PileS2-24": {"subQuestions": [0, 0, 0]},
    "ARF-PileS2-25": {"subQuestions": [1, 2, 1]},
    "ARF-PileS2-26": {"subQuestions": [0, 0]},
    "ARF-PileS2-27": {"subQuestions": [1, 1]},
    "ARF-PileS2-28": {"subQuestions": [1, 0]},
    "ARF-PileS2-29": {"subQuestions": [0, 1, 1]},
    "ARF-PileS2-30": {"subQuestions": [0, 2]}
}

file_path = 'json/new/ARF-02-B.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Handle both array and dictionary wrapper
questions = []
if isinstance(data, list):
    questions = data
elif isinstance(data, dict) and 'entries' in data:
    questions = data['entries']

for q in questions:
    qid = q.get('id')
    if qid in answers:
        ans = answers[qid]
        q['explanation'] = "Answered & Explained by GenAI"
        
        if 'correctOptions' in ans:
            q['correctOptions'] = ans['correctOptions']
        
        if 'subQuestions' in ans and 'subQuestions' in q:
            for idx, sq in enumerate(q['subQuestions']):
                if idx < len(ans['subQuestions']):
                    sq['correctOption'] = ans['subQuestions'][idx]

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    if isinstance(data, list):
        json.dump(questions, f, indent=2)
    else:
        # If it was wrapped, preserve wrapper
        data['entries'] = questions
        json.dump(data, f, indent=2)

print(f"Updated {len(questions)} questions in {file_path}")
