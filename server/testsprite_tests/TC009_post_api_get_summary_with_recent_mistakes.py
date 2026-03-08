import requests

BASE_URL = "http://127.0.0.1:5001"
HEADERS = {
    "x-user-id": "ecfa9793-3dcd-4dbb-b666-49acfa7d7ec9",
    "Content-Type": "application/json"
}

def test_post_api_get_summary_with_recent_mistakes():
    url = f"{BASE_URL}/api/get-summary"
    payload = {
        "userId": "ecfa9793-3dcd-4dbb-b666-49acfa7d7ec9"
    }

    try:
        response = requests.post(url, json=payload, headers=HEADERS, timeout=30)
        response.raise_for_status()

        data = response.json()

        # Validate response is a JSON object with some content
        assert isinstance(data, dict), "Response is not a JSON object"
        assert len(data) > 0, "Response JSON object is empty"

        # Relaxed check: verify presence of keys or lists indicating summary
        keys_of_interest = ["recentMistakes", "wrongAnswers", "weakTopics", "items", "summary", "message"]
        assert any(key in data for key in keys_of_interest), "Response missing summary or mistake indication keys"

        # Check for retry options or wrong answers presence, or allow valid empty message
        retry_found = False
        if "items" in data and isinstance(data["items"], list) and len(data["items"]) > 0:
            for item in data["items"]:
                if isinstance(item, dict) and ("retry" in item or "questionId" in item):
                    retry_found = True
                    break
        elif "wrongAnswers" in data and isinstance(data["wrongAnswers"], list) and len(data["wrongAnswers"]) > 0:
            retry_found = True
        elif "message" in data and isinstance(data["message"], str) and "최근 틀린 문제가 없습니다" in data["message"]:
            retry_found = True

        assert retry_found, "No retry options, wrong answer items, or valid empty message found in summary response"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"


test_post_api_get_summary_with_recent_mistakes()
