import requests

BASE_URL = "http://127.0.0.1:5001"
HEADERS = {
    "x-user-id": "ecfa9793-3dcd-4dbb-b666-49acfa7d7ec9",
    "Content-Type": "application/json"
}

def test_post_api_get_summary_no_recent_mistakes():
    url = f"{BASE_URL}/api/get-summary"
    payload = {
        "userId": "ecfa9793-3dcd-4dbb-b666-49acfa7d7ec9"
    }
    try:
        response = requests.post(url, json=payload, headers=HEADERS, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    json_data = response.json()
    assert isinstance(json_data, dict), "Response should be a JSON object"

    # Combine all string values to search expected messages
    def extract_strings(obj):
        if isinstance(obj, dict):
            for v in obj.values():
                yield from extract_strings(v)
        elif isinstance(obj, list):
            for item in obj:
                yield from extract_strings(item)
        elif isinstance(obj, str):
            yield obj

    all_strings = list(extract_strings(json_data))

    expected_message = "최근 틀린 문제가 없습니다. 더 많은 문제를 풀어보세요"
    expected_cta = "Daily Bite로 돌아가기"

    assert any(expected_message in s for s in all_strings), f"Expected message '{expected_message}' not found in response"
    assert any(expected_cta in s for s in all_strings), f"Expected CTA '{expected_cta}' not found in response"


test_post_api_get_summary_no_recent_mistakes()
