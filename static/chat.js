class ChatController {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.voiceButton = document.getElementById('voiceButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.status = document.getElementById('status');
        
        this.isListening = false;
        this.recognition = null;
        
        this.init();
    }

    init() {
        console.log("ChatController initialized");
        
        // Set up event listeners
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        this.voiceButton.addEventListener('click', () => this.toggleVoiceInput());
        
        this.updateStatus('Ready to chat');
        
        // Test backend connection
        this.testBackendConnection();
    }

    async testBackendConnection() {
        try {
            this.updateStatus('Testing connection...');
            const response = await fetch('/api/status');
            if (response.ok) {
                const data = await response.json();
                if (data.using_real_llm) {
                    this.updateStatus('Connected to LLM backend');
                } else {
                    this.updateStatus('Connected (using demo mode)');
                }
            } else {
                this.updateStatus('Backend connection failed');
            }
        } catch (error) {
            console.error('Connection test failed:', error);
            this.updateStatus('Backend not available - using demo mode');
        }
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        console.log("Sending message:", message);
        
        if (!message) {
            this.updateStatus('Please enter a message');
            this.userInput.focus();
            return;
        }

        // Add user message to chat immediately
        this.addMessage(message, 'user');
        this.userInput.value = '';
        
        // Disable input while processing
        this.setInputState(false);
        
        // Show typing indicator
        this.showTypingIndicator();
        this.updateStatus('Processing your message...');
        
        // Trigger thinking animation
        if (window.avatar) {
            window.avatar.setExpression('thinking');
        }
        
        try {
            // Send to backend
            const response = await this.sendToBackend(message);
            
            // Hide typing indicator and add response
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
            this.updateStatus('Response received');
            
            // Make avatar talk with appropriate expressions
            this.speakResponse(response);
            
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addMessage("I'm having trouble connecting right now. Please try again.", 'bot');
            this.updateStatus('Error: ' + error.message);
            
            // Set error expression
            if (window.avatar) {
                window.avatar.setExpression('sad');
            }
        } finally {
            // Re-enable input
            this.setInputState(true);
            this.userInput.focus();
        }
    }

    setInputState(enabled) {
        this.userInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
        this.voiceButton.disabled = !enabled;
    }

    async sendToBackend(message) {
        console.log('Sending to backend:', message);
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (data.status === 'error') {
            throw new Error(data.error || 'Unknown error from server');
        }
        
        return data.response;
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'block';
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    updateStatus(message) {
        this.status.textContent = message;
        console.log('Status:', message);
    }

    speakResponse(text) {
        // Set appropriate expression based on content
        this.setExpressionForResponse(text);
        
        // Make avatar talk
        if (window.avatar) {
            window.avatar.startTalking();
            
            // Calculate speaking duration based on text length
            const duration = Math.max(2000, text.length * 100);
            
            // Stop talking after calculated duration
            setTimeout(() => {
                if (window.avatar) {
                    window.avatar.stopTalking();
                    // Return to neutral expression after speaking
                    setTimeout(() => {
                        if (window.avatar) {
                            window.avatar.setExpression('neutral');
                        }
                    }, 500);
                }
            }, duration);
        }
        
        // Use Web Speech API for text-to-speech
        if ('speechSynthesis' in window) {
            // Stop any ongoing speech
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            utterance.onstart = () => {
                this.updateStatus('Mike is speaking...');
            };
            
            utterance.onend = () => {
                this.updateStatus('Ready to chat');
                if (window.avatar) {
                    window.avatar.stopTalking();
                    window.avatar.setExpression('neutral');
                }
            };
            
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.updateStatus('Ready to chat');
                if (window.avatar) {
                    window.avatar.stopTalking();
                    window.avatar.setExpression('neutral');
                }
            };
            
            speechSynthesis.speak(utterance);
        }
    }

    setExpressionForResponse(text) {
        if (!window.avatar) return;
        
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('wonderful') || lowerText.includes('excellent')) {
            window.avatar.setExpression('happy');
        } else if (lowerText.includes('sorry') || lowerText.includes('unfortunately') || lowerText.includes('problem')) {
            window.avatar.setExpression('sad');
        } else if (lowerText.includes('surprised') || lowerText.includes('wow') || lowerText.includes('amazing')) {
            window.avatar.setExpression('surprised');
        } else if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('annoying')) {
            window.avatar.setExpression('angry');
        } else {
            window.avatar.setExpression('neutral');
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.initSpeechRecognition();
        }
        
        if (!this.recognition) {
            this.updateStatus('Speech recognition not supported in this browser');
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.userInput.value = ''; // Clear input field
            this.recognition.start();
        }
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateStatus('Listening... Speak now');
                this.voiceButton.style.background = '#f44336';
                this.voiceButton.textContent = '🔴';
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.userInput.value = transcript;
                this.sendMessage();
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateStatus('Error: ' + event.error);
                this.isListening = false;
                this.voiceButton.style.background = '#2196F3';
                this.voiceButton.textContent = '🎤';
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.voiceButton.style.background = '#2196F3';
                this.voiceButton.textContent = '🎤';
                this.updateStatus('Ready to chat');
            };
        } else {
            this.voiceButton.disabled = true;
            this.voiceButton.title = 'Speech recognition not supported';
            console.log('Speech recognition not supported in this browser');
        }
    }

    clearChat() {
        this.chatMessages.innerHTML = '';
        this.addMessage("Hello! I'm Mike, your photorealistic AI assistant. How can I help you today?", 'bot');
        this.updateStatus('Chat cleared');
        
        // Reset avatar to neutral state
        if (window.avatar) {
            window.avatar.resetPose();
        }
        
        // Clear backend memory if needed
        fetch('/api/clear', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                console.log('Chat cleared:', data);
            })
            .catch(err => console.error('Error clearing backend:', err));
    }
}

// Global functions for HTML buttons
function changeAvatarExpression(expression) {
    if (window.avatar) {
        window.avatar.setExpression(expression);
    }
}

function resetAvatar() {
    if (window.avatar) {
        window.avatar.resetPose();
    }
}

function waveAvatar() {
    if (window.avatar) {
        window.avatar.triggerGesture('wave');
    }
}

function clearChat() {
    if (window.chatController) {
        window.chatController.clearChat();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing chat...");
    window.chatController = new ChatController();
    
    // Load voices for speech synthesis
    if ('speechSynthesis' in window) {
        speechSynthesis.getVoices(); // Preload voices
    }
});