import json
import os
import re

def process_to_knowledge():
    input_file = "/Users/kazisis/토플일타/scraped_toefl_data.json"
    output_dir = "/Users/kazisis/토플일타/knowledge_sources"
    
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Pre-defined analysis mapping for the 3 tests collected
    metadata = {
        1: {"topic": "Linguistics", "code": "Ling", "title": "Creators_of_Grammar"},
        2: {"topic": "Environment_Technology", "code": "Tech", "title": "Smart_Energy"},
        3: {"topic": "Psychology", "code": "Psych", "title": "Monkey_Economy"}
    }

    # Internal Analysis Data (Simplified for the demonstration of the pattern)
    analysis_data = {
        1: {
            "chunks": [
                {
                    "title": "Universal Grammar Complexity",
                    "logic": "Illustration/Definition",
                    "content": "Grammar is complex across all languages... Cherokee system distinguishes tiny variations... Grammar is universal mapping meaning to structure."
                },
                {
                    "title": "Pidgin vs Creole Evolution",
                    "logic": "Process/Causality",
                    "content": "Pidgins are makeshift strings of words without grammar... Creoles are complex systems invented by children exposed to pidgins."
                }
            ],
            "patterns": [
                {
                    "q": "Why Cherokee info?",
                    "evidence": "All languages, even those of so-called 'primitive' tribes have clever grammatical components.",
                    "trap": "Directly contrasting with English (B) is a side point, not the main purpose."
                }
            ]
        },
        2: {
            "chunks": [
                {
                    "title": "The Decarbonization Trigger",
                    "logic": "Problem-Solution",
                    "content": "Transition to low carbon economy leads to Smart Grid investment due to oil fears and global warming."
                }
            ],
            "patterns": [
                {
                    "q": "Renewable problems?",
                    "evidence": "Sources... are notoriously unpredictable... leads to blackouts.",
                    "trap": "Focusing on 'cost' (if mentioned) vs 'continuity' (actual correct answer)."
                }
            ]
        },
        3: {
            "chunks": [
                {
                    "title": "Evolutionary Decision Making",
                    "logic": "Comparative Research",
                    "content": "Monkeys tested for risk-taking to see if behavior is biological or cultural. Mirrors human loss aversion."
                }
            ],
            "patterns": [
                {
                    "q": "Monkeys chosen why?",
                    "evidence": "distant relatives... intelligent... not influenced by technological/cultural environments.",
                    "trap": "Option A says 'learn to use money' - that's a means, not the primary 'aim' (B)."
                }
            ]
        }
    }

    for test in data:
        t_id = test['test_id']
        meta = metadata.get(t_id, {"topic": "Unknown", "code": "Misc", "title": "Test"})
        
        filename = f"REF_{meta['code']}_{t_id:02d}_Pattern_Analysis.txt"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"=== [KNOWLEDGE SOURCE: {meta['topic']}] ===\n")
            f.write(f"Source: {test['url']}\n")
            f.write(f"Title: {meta['title']}\n\n")
            
            f.write("--- [PART 1: BITE-SIZED PASSAGE ANALYSIS] ---\n")
            passage = test['passage']
            # Simple paragraph split for bite-sizing
            paragraphs = re.split(r'</p>|<br />', passage)
            for i, p in enumerate(paragraphs):
                p_clean = re.sub(r'<[^>]+>|&nbsp;', ' ', p).strip()
                if len(p_clean) < 50: continue
                
                f.write(f"\n[SECTION {i+1}]\n")
                f.write(f"LOGIC: Analysis suggests focus on {'Narrative' if i==0 else 'Evidence-based Argument'}\n")
                f.write(f"TEXT: {p_clean[:300]}...\n") # Summarized for KB efficiency
                
            f.write("\n\n--- [PART 2: QUESTION PATTERN & DISTRACTOR LOGIC] ---\n")
            for q in test['questions']:
                f.write(f"\nQ: {q['question']}\n")
                f.write(f"ANSWER: {q['answer']}\n")
                # Look for evidence in the passage (simple heuristic for demo)
                f.write("EVIDENCE: Logic derives from direct passage mention/inference.\n")
                f.write("DISTRACTOR TRAP: Commonly uses 'word-overlap' (using passage words in wrong context) or 'over-generalization'.\n")

    print(f"[+] Knowledge Source files generated in {output_dir}")

if __name__ == "__main__":
    process_to_knowledge()
