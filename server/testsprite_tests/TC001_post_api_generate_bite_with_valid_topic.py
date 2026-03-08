import requests
import time

BASE_URL = "http://127.0.0.1:5001"
HEADERS = {
    "x-user-id": "ecfa9793-3dcd-4dbb-b666-49acfa7d7ec9",
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_post_api_generate_bite_with_valid_topic():
    try:
        # Step 1: Call /api/generate-bite with valid topic
        payload_generate = {
            "topic": "Biology"
        }
        response_generate = requests.post(
            f"{BASE_URL}/api/generate-bite",
            headers=HEADERS,
            json=payload_generate,
            timeout=TIMEOUT
        )
        assert response_generate.status_code == 200, f"Expected 200 OK but got {response_generate.status_code}"
        data_generate = response_generate.json()

        # Validate that passage, question, options and timer start are returned
        # Check required fields existence and types
        passage = data_generate.get("passage")
        question = data_generate.get("question")
        options = data_generate.get("options")
        timer_seconds = 90  # timer should be 90 seconds per requirement

        assert passage is not None and isinstance(passage, str) and passage.strip() != "", "Passage missing or invalid"
        assert question is not None and isinstance(question, str) and question.strip() != "", "Question missing or invalid"
        assert options is not None and isinstance(options, list) and len(options) > 0, "Options missing or invalid"
        # Check options content type string
        for opt in options:
            assert isinstance(opt, str) and opt.strip() != "", "Invalid option detected"

        # Check timer presence and correctness if provided
        timer = data_generate.get("timer")
        if timer is not None:
            assert isinstance(timer, int) and timer == timer_seconds, "Timer should be 90 seconds"

        # Simulate selecting an answer to save result
        # Choose first option as answer arbitrarily
        user_answer = options[0]
        question_id = data_generate.get("questionId")
        assert question_id is not None and isinstance(question_id, str), "questionId missing or invalid"

        # Assuming the chosen answer is correct or incorrect unknown, we pick True for test
        is_correct = True

        # Assume timeSpent less than or equal to 90 seconds (simulate 5 seconds spent)
        time_spent = 5

        payload_save_result = {
            "userId": HEADERS["x-user-id"],
            "questionId": question_id,
            "userAnswer": user_answer,
            "isCorrect": is_correct,
            "timeSpent": time_spent
        }

        response_save = requests.post(
            f"{BASE_URL}/api/save-result",
            headers=HEADERS,
            json=payload_save_result,
            timeout=TIMEOUT
        )
        assert response_save.status_code == 200, f"Expected 200 OK from save-result but got {response_save.status_code}"
        data_save = response_save.json()

        # Validate timeSpent is stored as sent (if returned)
        if "timeSpent" in data_save:
            assert data_save["timeSpent"] == time_spent, "timeSpent not saved correctly"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_generate_bite_with_valid_topic()