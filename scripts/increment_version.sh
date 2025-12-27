#!/bin/bash

# Define files to update (relative to the script location)
# We assume the script is in /scripts, so we go up one level to root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$DIR/.."

FILES=("$PROJECT_ROOT/index.html" "$PROJECT_ROOT/admin.html")

# Loop through files and apply the regex replacement
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Perl regex to find vX.Y.Z and increment Z
        # -i: in-place edit
        # -p: print lines
        # -e: execute command
        # s/.../.../ge: search/replace with 'e' flag to evaluate the replacement as code
        perl -i -pe 's/v(\d+)\.(\d+)\.(\d+)/"v$1.$2.".($3+1)/ge' "$file"
        echo "Updated version in $file"
    else
        echo "File not found: $file"
    fi
done
