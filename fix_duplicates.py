import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    react_import_indices = []
    for i, line in enumerate(lines):
        if re.search(r'import .* from ["\']react["\'];', line):
            react_import_indices.append(i)
    
    if len(react_import_indices) > 1:
        # Check if we have a simple 'import React from "react";'
        simple_index = -1
        for idx in react_import_indices:
            if lines[idx].strip() in ['import React from "react";', "import React from 'react';", 'import React from "react"', "import React from 'react'"]:
                simple_index = idx
                break
        
        if simple_index != -1:
            # We have a simple import and at least one other react import.
            # Remove the simple one.
            lines.pop(simple_index)
            with open(filepath, 'w') as f:
                f.writelines(lines)
            print(f"Removed duplicate simple React import from {filepath}")

for root, dirs, files in os.walk('/home/AIS/decision-pro-admin'):
    if '.next' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            fix_file(os.path.join(root, file))
