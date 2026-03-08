import requests
from bs4 import BeautifulSoup
import json
import csv
import re

def scrape_exam_english_toefl(test_id=1):
    url = f"https://www.examenglish.com/TOEFL/XML/toefl_reading{test_id}.xml"
    print(f"[*] Scraping {url}...")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"[!] Failed to fetch {url}")
        return None
    
    # Parse XML
    soup = BeautifulSoup(response.content, "xml")
    
    # 1. Extract Passage
    extract_tag = soup.find("extract1")
    if not extract_tag:
        return None
    
    # Strip HTML tags from passage but keep the text
    passage_raw = extract_tag.get_text()
    # Clean up whitespace and HTML entities if any
    passage = re.sub(r'\s+', ' ', passage_raw).strip()
    
    # 2. Extract Questions
    questions = []
    
    # Regular items
    items = soup.find_all("item")
    for item in items:
        q_text = item.find("text").get_text(strip=True)
        # Clean up question text (remove <br>, etc)
        q_text = re.sub(r'<[^>]+>', ' ', q_text).strip()
        
        choices = []
        answer = ""
        explanation = "" # Exam English often puts explanation in 'feedback' if it's longer
        
        for choice in item.find_all("choice"):
            is_correct = choice.get("feedback") == "Correct"
            text = choice.get_text(strip=True)
            choices.append(text)
            if is_correct:
                answer = text[0] if text[1:2] == " " else text # Usually "A text..."
        
        questions.append({
            "question": q_text,
            "options": choices,
            "answer": answer,
            "explanation": "See choice feedback"
        })
        
    # Multiple choice items (item2)
    items2 = soup.find_all("item2")
    for item in items2:
        q_text = item.find("text").get_text(strip=True)
        q_text = re.sub(r'<[^>]+>', ' ', q_text).strip()
        
        choices = []
        correct_answers = []
        
        for choice in item.find_all("choice"):
            is_correct = choice.get("feedback") == "Correct"
            text = choice.get_text(strip=True)
            choices.append(text)
            if is_correct:
                correct_answers.append(text[0] if text[1:2] == " " else text)
        
        questions.append({
            "question": q_text,
            "options": choices,
            "answer": ", ".join(correct_answers),
            "explanation": "Multiple selection question"
        })
        
    return {
        "test_id": test_id,
        "url": url,
        "passage": passage,
        "questions": questions
    }

def main():
    all_data = []
    # Scraping first 3 tests for demonstration
    for i in range(1, 4):
        data = scrape_exam_english_toefl(i)
        if data:
            all_data.append(data)
            
    # Save to JSON
    with open("scraped_toefl_data.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print("[+] Saved to scraped_toefl_data.json")
    
    # Save to CSV
    with open("scraped_toefl_data.csv", "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["Test_ID", "Passage", "Question", "Options", "Answer", "Explanation"])
        for test in all_data:
            test_id = test.get("test_id", "N/A")
            passage = test.get("passage", "")
            for q in test.get("questions", []):
                writer.writerow([
                    test_id,
                    passage[:200] + "...",
                    q.get("question", ""),
                    " | ".join(q.get("options", [])),
                    q.get("answer", ""),
                    q.get("explanation", "")
                ])
    print("[+] Saved to scraped_toefl_data.csv")

if __name__ == "__main__":
    main()
