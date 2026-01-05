import json
import glob
import sys
import os

# --- Configuration ---

# Target File Pattern
TARGET_PATTERN = 'json/new/*.json'

# Update Definitions
# Map Question ID -> { field_to_update: new_value }
# Example: "101": { "answer": [0], "explanation": "Corrected explanation..." }
UPDATES = {
    # "101": { "answer": [2] },
    # "105": { "explanation": "Updated explanation text." }
}

# --- Script Logic ---

def batch_update_answers():
    files = glob.glob(TARGET_PATTERN)
    if not files:
        print(f"No files found for pattern: {TARGET_PATTERN}")
        return

    updates_applied_total = 0

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            entries = []
            is_dict_wrapper = False
            
            if isinstance(data, list):
                entries = data
            elif isinstance(data, dict) and 'entries' in data:
                entries = data['entries']
                is_dict_wrapper = True
            else:
                continue

            file_updates = 0
            
            for entry in entries:
                q_id = str(entry.get('id', ''))
                if q_id in UPDATES:
                    changes = UPDATES[q_id]
                    for field, value in changes.items():
                        # Optional: check if changed
                        # if entry.get(field) != value:
                        entry[field] = value
                        file_updates += 1

            if file_updates > 0:
                with open(file_path, 'w', encoding='utf-8') as f:
                    if is_dict_wrapper:
                        data['entries'] = entries
                        json.dump(data, f, indent=2)
                    else:
                        json.dump(entries, f, indent=2)
                print(f"  [UPDATED] {file_path}: {file_updates} changes applied.")
                updates_applied_total += file_updates

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    if updates_applied_total == 0:
        print("No updates applied. Check if IDs match or if UPDATES dictionary is empty.")
    else:
        print(f"Total updates applied: {updates_applied_total}")

if __name__ == "__main__":
    print("Starting batch answer update...")
    if not UPDATES:
        print("Warning: UPDATES dictionary is empty. No changes will be made.")
    batch_update_answers()