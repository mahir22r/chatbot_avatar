from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sys
import os
import json

# Add the current directory to Python path to import your modules
sys.path.append(os.path.dirname(__file__))

# Import your existing chatbot modules
try:
    from llm_client import chat_with_llm
    from memory import update_context, build_prompt_with_memory, load_memory_entries
    from tts_client import AzureTTS
    print("Successfully imported chatbot modules")
except ImportError as e:
    print(f"Import error: {e}")
    # Create mock functions for development
    def chat_with_llm(messages):
        return "This is a mock response from the chatbot backend."
    
    def update_context(role, content):
        pass
    
    def build_prompt_with_memory(text):
        return [{"role": "user", "content": text}]
    
    def load_memory_entries():
        return []

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize TTS (optional for web version)
try:
    tts = AzureTTS()
except:
    tts = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Empty message'}), 400
        
        print(f"Received message: {user_message}")
        
        # Use your existing chatbot logic
        update_context("user", user_message)
        messages = build_prompt_with_memory(user_message)
        response = chat_with_llm(messages)
        
        if response:
            update_context("assistant", response)
            return jsonify({
                'response': response,
                'status': 'success'
            })
        else:
            return jsonify({
                'response': "I'm sorry, I couldn't process that request. Please try again.",
                'status': 'error'
            }), 500
            
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({
            'response': "An error occurred while processing your message.",
            'status': 'error'
        }), 500

@app.route('/api/voice', methods=['POST'])
def voice_chat():
    try:
        # This endpoint would handle audio files for STT
        # For now, it's a placeholder
        return jsonify({
            'response': "Voice chat endpoint - to be implemented",
            'status': 'success'
        })
    except Exception as e:
        print(f"Error in voice endpoint: {e}")
        return jsonify({'error': 'Voice processing failed'}), 500

@app.route('/api/status')
def status():
    return jsonify({
        'status': 'running',
        'memory_entries': len(load_memory_entries()),
        'tts_available': tts is not None
    })

if __name__ == '__main__':
    # Create templates and static directories if they don't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    
    # Move the HTML file to templates directory
    import shutil
    if os.path.exists('index.html'):
        shutil.move('index.html', 'templates/index.html')
    
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)