import os
import re

directory = '/Users/yahyamohnd/Desktop/vrital_web/admin/src'

replacements = [
    (r'bg-sidebar', 'bg-surface'),
    (r'bg-panel', 'bg-surface-bright'),
    (r'bg-white/5', 'bg-surface-container-low'),
    (r'bg-white/10', 'bg-surface-container'),
    (r'bg-white/2', 'bg-surface-container-low'),
    (r'bg-white/3', 'bg-surface-container-low'),
    (r'text-white/[5-9]0', 'text-secondary'),
    (r'text-white/[1-4]0', 'text-secondary'),
    (r'text-white(?!\/)', 'text-primary'),
    (r'border-white/10', 'border-outline-variant'),
    (r'border-white/5', 'border-outline-variant'),
    (r'border-white/20', 'border-outline-variant'),
    (r'bg-brand-500/15', 'bg-primary-container'),
    (r'text-brand-400', 'text-primary'),
    (r'border-brand-500/20', 'border-primary'),
    (r'gradient-text', 'text-primary'),
    (r'text-red-[3-5]00', 'text-error'),
    (r'bg-red-[3-5]00/10', 'bg-error-container'),
    (r'text-yellow-[3-5]00', 'text-on-surface-variant'),
    (r'style=\{\{\s*background:\s*"linear-gradient[^"]*"\s*\}\}', ''),
]

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content
            for pattern, repl in replacements:
                new_content = re.sub(pattern, repl, new_content)
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
