import os
from dotenv import load_dotenv
from llm_client import chat_with_llm

load_dotenv()

def test_llm():
    print("Testing LLM connection...")
    print(f"API Key: {os.getenv('API_KEY')[:10]}...")
    print(f"Model: {os.getenv('LLM_MODEL_NAME')}")
    print(f"Endpoint: {os.getenv('LLM_ENDPOINT')}")
    
    test_messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is a prime number? Give a short answer."}
    ]
    
    print("\nSending test message...")
    response = chat_with_llm(test_messages)
    
    if response:
        print(f"✅ SUCCESS! Response: {response}")
    else:
        print("❌ FAILED! No response received.")

if __name__ == "__main__":
    test_llm()