import json
import glob
import os

# --- Configuration ---
SOURCE_DIR = 'json/new'
FILE_PATTERN = '*-E-*.json' # e.g. Match files with 'E' set identifier
OUTPUT_FILE = 'json/combined/combined-set-extra.json'

# Metadata Injection
TARGET_SET_ID = 'extra' # Value for 'set' field in combined output

# --- Script Logic ---

def combine_set():
    pattern = os.path.join(SOURCE_DIR, FILE_PATTERN)
    files = glob.glob(pattern)
    files.sort()

    if not files:
        print(f"No files found matching: {pattern}")
        return

    combined_entries = []
    
    print(f"Combining {len(files)} files into {OUTPUT_FILE}...")

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            entries = []
            if isinstance(data, list):
                entries = data
            elif isinstance(data, dict) and 'entries' in data:
                entries = data['entries']
            
            # Extract basic chapter info from filename if possible
            # Assumption: Filename format like SUBJECT-SET-CHAPTER.json
            filename = os.path.basename(file_path)
            parts = filename.replace('.json', '').split('-')
            chapter = parts[-1] if len(parts) > 0 else 'unknown'

            for entry in entries:
                entry['set'] = TARGET_SET_ID
                entry['chapter'] = chapter
                # Add source filename for traceability
                # entry['_source'] = filename 
                combined_entries.append(entry)

            print(f"  Loaded {len(entries)} from {filename}")

        except Exception as e:
            print(f"  Error reading {file_path}: {e}")

    # Ensure output dir exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({"entries": combined_entries}, f, indent=2)

    print(f"\nSuccess! Wrote {len(combined_entries)} entries to {OUTPUT_FILE}")

if __name__ == "__main__":
    combine_set()