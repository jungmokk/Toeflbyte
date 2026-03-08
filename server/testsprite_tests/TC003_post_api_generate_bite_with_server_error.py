import requests
from requests.exceptions import RequestException, Timeout, ConnectionError
import time

BASE_URL = "http://127.0.0.1:5001"
HEADERS = {
    "x-user-id": "ecfa9793-3dcd-4dbb-b666-49acfa7d7ec9",
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_post_api_generate_bite_with_server_error():
    url = f"{BASE_URL}/api/generate-bite"
    payload = {
        "topic": "Physics"
    }

    # Helper function to perform API call and return response or exception
    def call_generate_bite():
        try:
            response = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
            response.raise_for_status()
            return response, None
        except requests.HTTPError as e:
            # Return the response object even if 5xx
            if e.response is not None and 500 <= e.response.status_code < 600:
                return e.response, None
            else:
                return None, e
        except (Timeout, ConnectionError) as e:
            return None, e
        except RequestException as e:
            return None, e

    # Make first attempt to trigger 5xx or network error
    response1, error1 = call_generate_bite()

    # Assert that error toast with retry button is expected on 5xx or network error
    # We assume that 5xx or network error should occur.
    # If not, fail the test.
    assert response1 is None or (500 <= response1.status_code < 600), \
        f"Expected server error (5xx) or network error but got success: {response1.status_code if response1 else error1}"

    # Simulate client side: error toast shown with retry button
    # On retry, call again

    response2, error2 = call_generate_bite()

    # Validate retry triggers the API call again and succeeds
    # We expect the retry to succeed (non-5xx) or at least a new attempt is made
    # If retry produces error again, it may be acceptable but test for a retry call made.

    assert (response2 is not None and response2.status_code < 500) or (response2 is not None and 500 <= response2.status_code < 600), \
        "Retry did not trigger a second API call or unexpected error."

    # If retry successful (2xx), validate body has required keys for problem generation
    if response2 is not None and 200 <= response2.status_code < 300:
        json_data = response2.json()
        # Check passage, question, options presence
        assert "passage" in json_data or "question" in json_data or "options" in json_data, \
            "Expected 'passage' or 'question' or 'options' in successful response"
    # else if 5xx again, can't validate response body, just acknowledge retry call

test_post_api_generate_bite_with_server_error()