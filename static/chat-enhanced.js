/**
 * ChatManager - Enhanced chat system with emotion detection and avatar integration
 * Handles real-time messaging, voice input, and avatar animations
 */

class ChatManager {
    constructor() {
        try {
            console.log('💬 ChatManager constructor started');
            this.userInput = document.getElementById('userInput');
            this.chatMessages = document.getElementById('chatMessages');
            this.voiceBtn = document.getElementById('voiceBtn');
            this.statusText = document.getElementById('statusText');
            this.connectionStatus = document.getElementById('connectionStatus');
            this.aiStatus = document.getElementById('aiStatus');
            
            this.isListening = false;
            this.recognition = null;
            this.speechSynthesis = 'speechSynthesis' in window ? window.speechSynthesis : null;
            
            this.messageBuffer = [];
            this.lastMessageTime = 0;
            
            console.log('📝 Initializing ChatManager...');
            this.init();
            console.log('✅ ChatManager initialized successfully!');
        } catch (error) {
            console.error('❌ Error in ChatManager constructor:', error);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }

    init() {
        console.log('ChatManager initializing...');
        
        // Event listeners
        document.getElementById('userInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Initialize speech recognition
        this.initSpeechRecognition();
        
        // Test backend
        this.testConnection();
    }

    async testConnection() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            if (data.using_real_llm) {
                this.connectionStatus.textContent = '✓ Connected • LLM Active';
                this.aiStatus.textContent = 'Real AI Backend';
            } else {
                this.connectionStatus.textContent = '✓ Connected • Demo Mode';
                this.aiStatus.textContent = 'Demo Mode';
            }
        } catch (err) {
            this.connectionStatus.textContent = '⚠ Demo Mode';
            console.error('Connection test failed:', err);
        }
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        
        if (!message) {
            this.userInput.focus();
            return;
        }
        
        // Prevent rapid-fire messages
        const now = Date.now();
        if (now - this.lastMessageTime < 500) {
            return;
        }
        this.lastMessageTime = now;
        
        // Add user message to UI
        this.addMessageToUI(message, 'user');
        this.userInput.value = '';
        this.userInput.focus();
        
        // Show thinking animation
        this.showTypingIndicator();
        this.statusText.textContent = 'Mike is thinking...';
        
        // Avatar reacts to user message
        if (window.avatarManager) {
            window.avatarManager.lookAtPosition(0, 1.4, 0.5);
            
            // Analyze emotion in user message for avatar response
            const userEmotion = this.analyzeMessageEmotion(message);
            if (message.includes('?')) {
                window.avatarManager.nod();
            }
        }
        
        try {
            // Send to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.response) {
                throw new Error('Empty response from server');
            }
            
            // Analyze response sentiment
            const emotion = this.analyzeMessageEmotion(data.response);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessageToUI(data.response, 'bot');
            
            // Avatar responds
            if (window.avatarManager) {
                window.avatarManager.setEmotion(emotion.emotion, emotion.intensity);
                window.avatarManager.startTalking(data.response.length * 60);
            }
            
            // Speak the response
            this.speakMessage(data.response);
            
            this.statusText.textContent = 'Mike is speaking...';
            
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            
            const errorMsg = 'Sorry, I encountered an error. Please try again.';
            this.addMessageToUI(errorMsg, 'bot');
            this.statusText.textContent = 'Error - Ready';
            
            if (window.avatarManager) {
                window.avatarManager.setEmotion('sad', 0.6);
                window.avatarManager.startTalking(2000);
            }
        }
    }

    analyzeMessageEmotion(message) {
        const lower = message.toLowerCase();
        
        // Simple sentiment analysis
        const happyWords = ['great', 'excellent', 'wonderful', 'amazing', 'awesome', 'love', 'happy', 'good'];
        const sadWords = ['sad', 'sorry', 'bad', 'terrible', 'awful', 'hate', 'disappointed', 'upset'];
        const surpriseWords = ['wow', 'amazing', 'shocked', 'surprised', 'incredible', 'unbelievable'];
        
        let emotion = 'neutral';
        let intensity = 0.5;
        
        const hasHappy = happyWords.some(w => lower.includes(w));
        const hasSad = sadWords.some(w => lower.includes(w));
        const hasSurprise = surpriseWords.some(w => lower.includes(w));
        
        if (hasSurprise) {
            emotion = 'surprised';
            intensity = 0.7;
        } else if (hasHappy) {
            emotion = 'happy';
            intensity = 0.7;
        } else if (hasSad) {
            emotion = 'sad';
            intensity = 0.6;
        } else {
            emotion = 'neutral';
            intensity = 0.5;
        }
        
        // Check for questions
        if (message.includes('?')) {
            emotion = 'neutral';
            intensity = 0.6;
        }
        
        // Intensity based on punctuation
        const exclamations = message.match(/!/g);
        if (exclamations && exclamations.length >= 2) {
            intensity = Math.min(1, intensity + 0.3);
        }
        
        return { emotion, intensity };
    }

    speakMessage(text) {
        if (!this.speechSynthesis) {
            this.statusText.textContent = 'Speech synthesis not available';
            return;
        }
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure speech
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.9;
        
        // Try to get a better voice
        const voices = this.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Prefer female voice
            const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('female'));
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            } else if (voices.length > 1) {
                utterance.voice = voices[1];
            }
        }
        
        utterance.onstart = () => {
            console.log('Speaking started');
            if (window.avatarManager) {
                window.avatarManager.isSpeaking = true;
            }
        };
        
        utterance.onend = () => {
            console.log('Speaking ended');
            if (window.avatarManager) {
                window.avatarManager.stopTalking();
            }
            this.statusText.textContent = 'Ready for next message';
        };
        
        utterance.onerror = (event) => {
            console.error('Speech error:', event);
            this.statusText.textContent = 'Speech error - Ready';
            if (window.avatarManager) {
                window.avatarManager.stopTalking();
            }
        };
        
        this.speechSynthesis.speak(utterance);
    }

    addMessageToUI(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        contentDiv.style.wordWrap = 'break-word';
        
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        // Check if already showing
        if (this.chatMessages.querySelector('.typing-indicator')) {
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        
        messageDiv.appendChild(indicator);
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = this.chatMessages.querySelector('.typing-indicator');
        if (indicator) {
            indicator.parentElement.remove();
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.statusText.textContent = 'Speech recognition not supported';
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.userInput.value = '';
            this.recognition.start();
        }
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported');
            this.voiceBtn.disabled = true;
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.voiceBtn.classList.add('listening');
            this.voiceBtn.textContent = '🔴';
            this.statusText.textContent = 'Listening... Speak now';
        };
        
        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            
            this.userInput.value = transcript;
            this.sendMessage();
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech error:', event.error);
            this.statusText.textContent = 'Listening error - Ready';
            this.isListening = false;
            this.voiceBtn.classList.remove('listening');
            this.voiceBtn.textContent = '🎤';
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.voiceBtn.classList.remove('listening');
            this.voiceBtn.textContent = '🎤';
        };
    }

    clearChat() {
        this.chatMessages.innerHTML = '';
        this.addMessageToUI(
            '👋 Chat cleared! Ready to start a new conversation.',
            'bot'
        );
        this.statusText.textContent = 'Chat cleared';
    }
}

// Load voices when available
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded');
    };
}
