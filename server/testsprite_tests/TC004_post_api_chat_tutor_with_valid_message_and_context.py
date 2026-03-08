import requests
import time

BASE_URL = "http://127.0.0.1:5001"
HEADERS = {
    "x-user-id": "ecfa9793-3dcd-4dbb-b666-49acfa7d7ec9",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_post_api_chat_tutor_with_valid_message_and_context():
    # Step 1: Generate a bite to get a valid question_context
    generate_bite_payload = {
        "topic": "Biology",
        "persona": "친절한 과외쌤"
    }
    qid = None
    try:
        gen_resp = requests.post(
            f"{BASE_URL}/api/generate-bite",
            headers=HEADERS,
            json=generate_bite_payload,
            timeout=TIMEOUT
        )
        assert gen_resp.status_code == 200, f"Generate bite failed with status {gen_resp.status_code}"
        gen_data = gen_resp.json()
        assert "question" in gen_data, "Response missing 'question'"
        assert "questionId" in gen_data, "Response missing 'questionId'"
        question_context = gen_data.get("question", {})
        qid = gen_data.get("questionId")
        assert isinstance(question_context, dict), "question_context is not a dict"
        assert qid is not None, "questionId is None"

        # Step 2: Send message and question_context to chat-tutor endpoint
        chat_payload = {
            "message": "왜 B가 정답이 아닌가요?",
            "question_context": question_context,
            "persona": "츤데레 일타강사"
        }

        chat_resp = requests.post(
            f"{BASE_URL}/api/chat-tutor",
            headers=HEADERS,
            json=chat_payload,
            timeout=TIMEOUT
        )
        assert chat_resp.status_code == 200, f"Chat tutor failed with status {chat_resp.status_code}"
        chat_data = chat_resp.json()
        # Validate AI explanation presence and pacing advice presence
        assert "explanation" in chat_data, "Response missing 'explanation'"
        explanation = chat_data["explanation"]
        assert isinstance(explanation, str) and len(explanation) > 0, "Explanation is empty or invalid"

        # Check cited passage signals in explanation (simple contain check)
        cited_phrases = ["signal", "evidence", "passage", "pace", "timing", "advice"]
        assert any(word in explanation.lower() for word in cited_phrases), "Explanation missing cited passage signals or pacing advice"

        # Step 3: Verify save-result API stores timeSpent correctly
        # Simulate time spent before sending save-result
        user_answer = "B"  # assumed answer for test
        is_correct = False  # assumed incorrect to trigger explanation
        time_spent = 45.7  # sample time spent in seconds

        save_result_payload = {
            "userId": HEADERS["x-user-id"],
            "questionId": qid,
            "userAnswer": user_answer,
            "isCorrect": is_correct,
            "timeSpent": time_spent
        }

        save_resp = requests.post(
            f"{BASE_URL}/api/save-result",
            headers=HEADERS,
            json=save_result_payload,
            timeout=TIMEOUT
        )
        assert save_resp.status_code == 200, f"Save-result failed with status {save_resp.status_code}"
        save_data = save_resp.json()
        # Verify timeSpent is recorded and reasonably close to sent value (if echoed)
        if "timeSpent" in save_data:
            returned_time_spent = save_data["timeSpent"]
            assert abs(returned_time_spent - time_spent) < 1.0, "timeSpent in response not matching sent value"

    finally:
        # Cleanup: no explicit resource to delete for chat tutor or generate-bite
        pass


test_post_api_chat_tutor_with_valid_message_and_context()