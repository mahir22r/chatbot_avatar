"""
Emotion and sentiment analyzer for the chatbot.
Provides emotional context to make the avatar's responses more human-like.
"""

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    sentiment_analyzer = SentimentIntensityAnalyzer()
    HAS_VADER = True
except ImportError:
    print("[WARNING] vaderSentiment not installed. Using basic sentiment analysis.")
    HAS_VADER = False
    sentiment_analyzer = None

import json

def analyze_sentiment(text):
    """
    Analyze the sentiment of text and return emotion data.
    Returns a dict with emotional state suitable for 3D avatar animations.
    """
    try:
        if HAS_VADER and sentiment_analyzer:
            # Get VADER sentiment scores
            scores = sentiment_analyzer.polarity_scores(text)
            
            # Convert to 0-1 range for easier use
            compound = scores['compound']  # -1 to 1, where 1 is most positive
        else:
            # Basic fallback analysis without VADER
            text_lower = text.lower()
            positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'awesome', 'perfect', 'fantastic']
            negative_words = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'disappointed', 'wrong', 'fail']
            
            pos_count = sum(1 for word in positive_words if word in text_lower)
            neg_count = sum(1 for word in negative_words if word in text_lower)
            
            compound = (pos_count - neg_count) / max(len(text.split()), 1)
            compound = max(-1, min(1, compound))  # Clamp to [-1, 1]
            scores = {
                'pos': 0.3 if pos_count > 0 else 0.1,
                'neg': 0.3 if neg_count > 0 else 0.1,
                'neu': 0.4
            }
        
        # Determine primary emotion
        if compound >= 0.5:
            emotion = 'happy'
            intensity = min(1.0, (compound - 0.5) / 0.5)
        elif compound >= 0.1:
            emotion = 'neutral'
            intensity = 0.5
        elif compound >= -0.3:
            emotion = 'neutral'
            intensity = 0.3
        else:
            emotion = 'sad'
            intensity = min(1.0, abs(compound + 0.3) / 0.7)
        
        # Detect surprise/excitement from exclamation marks and caps
        exclamation_count = text.count('!')
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        
        if exclamation_count >= 2 or caps_ratio > 0.3:
            emotion = 'surprised'
            intensity = min(1.0, (exclamation_count * 0.3 + caps_ratio))
        
        # Detect questions
        is_question = text.strip().endswith('?')
        
        return {
            'emotion': emotion,
            'intensity': intensity,
            'compound_score': compound,
            'is_question': is_question,
            'positive': scores['pos'],
            'negative': scores['neg'],
            'neutral': scores['neu']
        }
    except Exception as e:
        print(f"Error analyzing sentiment: {e}")
        return {
            'emotion': 'neutral',
            'intensity': 0.5,
            'compound_score': 0,
            'is_question': False,
            'positive': 0.3,
            'negative': 0.3,
            'neutral': 0.4
        }

def get_avatar_response_emotion(user_message, bot_response):
    """
    Determine what emotion the avatar should display when responding.
    Based on both user input and bot response.
    """
    user_sentiment = analyze_sentiment(user_message)
    response_sentiment = analyze_sentiment(bot_response)
    
    # Combine sentiments - if user is happy or bot response is positive, show happy
    combined_intensity = (response_sentiment['intensity'] + user_sentiment['intensity']) / 2
    
    # Priority: response emotion > user emotion
    primary_emotion = response_sentiment['emotion']
    
    # But if user asked a question, avatar should look engaged/interested
    if user_sentiment['is_question']:
        primary_emotion = 'neutral'
        combined_intensity = 0.7
    
    return {
        'emotion': primary_emotion,
        'intensity': combined_intensity,
        'head_tilt': 0.15 if user_sentiment['is_question'] else 0,
        'eyebrow_raise': 0.2 if response_sentiment['emotion'] == 'surprised' else 0,
        'smile_intensity': max(0, response_sentiment['compound_score']) * 2
    }

def format_emotion_response(emotion_data):
    """Convert emotion analysis to JSON for frontend."""
    return json.dumps(emotion_data, ensure_ascii=False)
