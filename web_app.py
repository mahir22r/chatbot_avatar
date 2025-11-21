from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sys
import os
import json
import threading
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path to import your modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import your actual chatbot modules
try:
    print("Importing real chatbot modules...")
    
    # Import your actual modules
    from llm_client import chat_with_llm
    from memory import update_context, build_prompt_with_memory, load_memory_entries, add_memory
    from emotion_analyzer import analyze_sentiment, get_avatar_response_emotion
    
    print("✓ Successfully imported real LLM client and memory modules")
    USE_REAL_LLM = True
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("✗ Will attempt to use fallback mode")
    USE_REAL_LLM = False
    
    # Fallback mock functions (only if real imports fail)
    def chat_with_llm(messages):
        user_message = messages[-1]["content"] if messages else "Hello"
        responses = [
            f"I understand you said: '{user_message}'. That's really interesting!",
            f"Thanks for sharing that! '{user_message}' is something I'd love to discuss more.",
            f"I appreciate you telling me about '{user_message}'. How can I help you further?",
        ]
        import random
        return random.choice(responses)
    
    conversation_history = []
    
    def update_context(role, content):
        conversation_history.append({"role": role, "content": content})
        if len(conversation_history) > 10:
            conversation_history.pop(0)
    
    def build_prompt_with_memory(user_text):
        messages = [
            {"role": "system", "content": "You are Mike, a friendly AI assistant. Keep responses conversational and helpful."}
        ]
        for item in conversation_history[-6:]:
            messages.append(item)
        messages.append({"role": "user", "content": user_text})
        return messages
    
    def load_memory_entries():
        return conversation_history
    
    def add_memory(text, role="user"):
        conversation_history.append({"role": role, "content": text, "ts": 123456789})
    
    def get_avatar_response_emotion(user_msg, bot_msg):
        return {'emotion': 'neutral', 'intensity': 0.5, 'head_tilt': 0, 'eyebrow_raise': 0, 'smile_intensity': 0}

app = Flask(__name__)
CORS(app)

class ChatManager:
    def __init__(self):
        self.conversation_history = []
        print(f"[ChatManager] Initialized - Using {'REAL LLM' if USE_REAL_LLM else 'FALLBACK MODE'}")
    
    def process_message(self, user_message):
        """Process user message using real LLM client"""
        try:
            print(f"\n[ChatManager] Processing message: {user_message}")
            
            # Add user message to context using your actual memory system
            add_memory(user_message, "user")
            
            # Build prompt with memory using your actual function
            messages = build_prompt_with_memory(user_message)
            
            print(f"[ChatManager] Sending to LLM with {len(messages)} messages")
            if USE_REAL_LLM:
                print(f"[ChatManager] Using REAL LLM endpoint")
            else:
                print(f"[ChatManager] Using FALLBACK responses")
            
            # Get LLM response using your actual client
            response = chat_with_llm(messages)
            
            if not response:
                raise Exception("Empty response from LLM")
            
            print(f"[ChatManager] Received LLM response: {response[:100]}...")
            
            # Add assistant response to context
            add_memory(response, "assistant")
            
            return response
            
        except Exception as e:
            print(f"[ChatManager] Error in process_message: {e}")
            import traceback
            traceback.print_exc()
            return f"I apologize, but I encountered an error. Please try again. (Error: {str(e)[:50]})"

chat_manager = ChatManager()

@app.route('/')
def index():
    return render_template('index_human.html')

@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
        
        user_message = data['message'].strip()
        if not user_message:
            return jsonify({'error': 'Empty message'}), 400
        
        print(f"Received message: {user_message}")
        
        # Process the message using real LLM
        response = chat_manager.process_message(user_message)
        
        # Analyze emotions for avatar animation
        try:
            emotion_data = get_avatar_response_emotion(user_message, response)
        except:
            emotion_data = {
                'emotion': 'neutral',
                'intensity': 0.5,
                'head_tilt': 0,
                'eyebrow_raise': 0,
                'smile_intensity': 0
            }
        
        print(f"Sending response: {response}")
        
        return jsonify({
            'response': response,
            'status': 'success',
            'emotion': emotion_data
        })
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({
            'error': f'Internal server error: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/api/status')
def status():
    try:
        entries = load_memory_entries()
        return jsonify({
            'status': 'running',
            'memory_entries': len(entries),
            'using_real_llm': 'chat_with_llm' in globals() and 'add_memory' in globals()
        })
    except:
        return jsonify({
            'status': 'running',
            'memory_entries': 0,
            'using_real_llm': False
        })

@app.route('/api/clear', methods=['POST'])
def clear_chat():
    try:
        # This would need to be implemented in your memory module
        # For now, we'll just return success
        return jsonify({'status': 'success', 'message': 'Clear functionality to be implemented'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    os.makedirs('templates', exist_ok=True)
    
    print("=" * 50)
    print("Starting Flask server with real LLM integration")
    print(f"LLM Endpoint: {os.getenv('LLM_ENDPOINT', 'Not set')}")
    print(f"LLM Model: {os.getenv('LLM_MODEL_NAME', 'Not set')}")
    print("Open your browser and go to: http://localhost:5000")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)

@app.route('/test_3d')
def test_3d():
    return render_template('test_3d.html')

@app.route('/debug')
def debug():
    return render_template('test_debug.html')