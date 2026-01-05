import json
import os
import glob
import sys

# --- Configuration ---

# File Pattern to process
# e.g., 'json/new/*.json' or 'json/new/ARF-02-*.json'
TARGET_PATTERN = 'json/new/*.json'

# Tag Mappings (Old/Raw Tag -> New Standardized Tag)
# Define your concept mappings here.
TAG_MAPPING = {
    # Example Area 1
    "Concept_A_Old": "Concept_A_Standard",
    "Misspelled_Tag": "Correct_Tag",
    
    # Area mappings (Groups)
    "#OLD_GROUP_NAME": "#NEW_GROUP_NAME",
    
    # ... Add your project specific mappings here ...
    # "AssuranceEngagement": "Assurance_Concept",
    # "ThreeParties": "Three_Party_Relationship",
}

# --- Script Logic ---

def update_files():
    # Find files matching the pattern
    files = glob.glob(TARGET_PATTERN)
    
    if not files:
        print(f"No files found matching pattern: {TARGET_PATTERN}")
        return

    print(f"Found {len(files)} files to process.")

    for file_path in files:
        # print(f"Processing {file_path}...")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle list vs dict wrapper
            entries = []
            is_dict_wrapper = False
            
            if isinstance(data, list):
                entries = data
            elif isinstance(data, dict) and 'entries' in data:
                entries = data['entries']
                is_dict_wrapper = True
            else:
                # print(f"  Skipping: Unknown JSON structure in {file_path}")
                continue

            updated_count = 0
            for entry in entries:
                original_tags = entry.get('tags', [])
                if not original_tags: 
                    continue

                new_tags_to_add = set()
                
                for tag in original_tags:
                    if tag in TAG_MAPPING:
                        new_tags_to_add.add(TAG_MAPPING[tag])
                
                # Identify tags that are actually new
                final_new_tags = [t for t in new_tags_to_add if t not in original_tags]
                
                if final_new_tags:
                    entry['tags'] = original_tags + final_new_tags
                    updated_count += 1
            
            # Save back if changes occurred
            if updated_count > 0:
                with open(file_path, 'w', encoding='utf-8') as f:
                    if is_dict_wrapper:
                        data['entries'] = entries
                        json.dump(data, f, indent=2)
                    else:
                        json.dump(entries, f, indent=2)
                print(f"  [UPDATED] {file_path}: {updated_count} entries modified.")
            else:
                pass # print(f"  [NO CHANGE] {file_path}")

        except Exception as e:
            print(f"  Error processing {file_path}: {e}")

if __name__ == "__main__":
    # Optional: Allow overriding pattern via CLI
    if len(sys.argv) > 1:
        TARGET_PATTERN = sys.argv[1]
    
    print(f"Starting tag update for pattern: {TARGET_PATTERN}")
    update_files()