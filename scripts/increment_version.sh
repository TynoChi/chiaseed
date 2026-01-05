#!/bin/bash

# --- Configuration ---
# List of files to update version numbers in.
# Paths are relative to the project root.
TARGET_FILES=(
    "index.html"
    "admin.html"
    # "package.json" # Optional: Add if you want to sync with package.json
)

# --- Script Logic ---

# Determine script location and project root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$DIR/.."

echo "Incrementing version numbers in project root: $PROJECT_ROOT"

for filename in "${TARGET_FILES[@]}"; do
    file="$PROJECT_ROOT/$filename"
    
    if [ -f "$file" ]; then
        # Perl regex to find vX.Y.Z and increment Z
        # Looks for patterns like "v1.0.0" or "v2.3.4"
        perl -i -pe 's/v(\d+)\.(\d+)\.(\d+)/"v$1.$2.".($3+1)/ge' "$file"
        echo "  [UPDATED] $filename"
    else
        echo "  [SKIPPED] $filename (Not found)"
    fi
done

echo "Version increment complete."