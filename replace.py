import os

files = [
    r"d:\Project\6thProject\frontend\src\app\page.tsx",
    r"d:\Project\6thProject\frontend\src\app\admin\page.tsx"
]

for p in files:
    with open(p, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Add API_URL definition
    if "const API_URL" not in content:
        content = content.replace("export default function", 'const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";\n\nexport default function')
    
    # Replace strings
    content = content.replace('"http://localhost:8000/', '`${API_URL}/')
    # Replace backticks
    content = content.replace('`http://localhost:8000/', '`${API_URL}/')
    
    # Also fix the trailing quote for the string replacements
    content = content.replace('`${API_URL}/v1/dashboard/stats"', '`${API_URL}/v1/dashboard/stats`')
    content = content.replace('`${API_URL}/v1/models/anomaly:scan_log"', '`${API_URL}/v1/models/anomaly:scan_log`')
    content = content.replace('`${API_URL}/v1/models/phishing:predict"', '`${API_URL}/v1/models/phishing:predict`')
    content = content.replace('`${API_URL}/v1/admin/db"', '`${API_URL}/v1/admin/db`')
    
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
print("Replaced successfully")
