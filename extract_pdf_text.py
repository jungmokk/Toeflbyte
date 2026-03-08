import pypdf
import json
import os

pdf_files = [
    'Toefl/test eaxmple3.pdf', 
    'Toefl/test example1.pdf', 
    'Toefl/test example2.pdf'
]

all_text = ""
for pdf_file in pdf_files:
    print(f"Reading {pdf_file}...")
    try:
        reader = pypdf.PdfReader(pdf_file)
        for page in reader.pages:
            all_text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading {pdf_file}: {e}")

with open('pdf_full_text.txt', 'w', encoding='utf-8') as f:
    f.write(all_text)

print(f"Extracted {len(all_text)} characters to pdf_full_text.txt")
