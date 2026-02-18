"""
CarubaAI - Python Backend API
==============================
Backend Flask untuk TTS dan layanan AI lainnya.

Endpoints:
- GET/POST /tts      : Text-to-Speech conversion
- GET /health        : Health check
- GET /audio/<path>  : Serve audio files

Run:
    python app.py
    
Or with Flask CLI:
    flask run --port 5000
"""

import os
import time
from pathlib import Path
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from tts_module import TTSEngine

# ========================================
# Configuration
# ========================================

app = Flask(__name__)

# Enable CORS for all routes (adjust origins for production)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# TTS Engine instance
tts_engine = TTSEngine(lang='id', slow=False)

# Cleanup interval (in seconds)
CLEANUP_INTERVAL = 3600  # 1 hour
last_cleanup_time = time.time()


# ========================================
# Helper Functions
# ========================================

def run_periodic_cleanup():
    """Run periodic cleanup of old audio files."""
    global last_cleanup_time
    current_time = time.time()
    
    if current_time - last_cleanup_time > CLEANUP_INTERVAL:
        tts_engine.clean_output(max_age_hours=1)
        tts_engine.clean_cache(max_files=100)
        last_cleanup_time = current_time


# ========================================
# Routes
# ========================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'CarubaAI Backend',
        'version': '1.0.0',
        'timestamp': time.time()
    })


@app.route('/tts', methods=['GET', 'POST'])
def text_to_speech():
    """
    Text-to-Speech endpoint.
    
    GET:
        Query params:
        - text: Text to convert (required)
        - lang: Language code (optional, default: 'id')
        - slow: Speak slowly (optional, default: false)
        - stream: Return audio stream (optional, default: false)
    
    POST:
        JSON body:
        {
            "text": "Text to convert",
            "lang": "id",
            "slow": false,
            "stream": false
        }
    
    Returns:
        - If stream=true: Audio file (audio/mpeg)
        - If stream=false: JSON with audio URL
    """
    run_periodic_cleanup()
    
    try:
        # Get parameters from request
        if request.method == 'GET':
            text = request.args.get('text', '').strip()
            lang = request.args.get('lang', 'id')
            slow = request.args.get('slow', 'false').lower() == 'true'
            stream = request.args.get('stream', 'false').lower() == 'true'
        else:  # POST
            data = request.get_json() or {}
            text = data.get('text', '').strip()
            lang = data.get('lang', 'id')
            slow = data.get('slow', False)
            stream = data.get('stream', False)
        
        # Validate text
        if not text:
            return jsonify({
                'success': False,
                'error': 'Text parameter is required'
            }), 400
        
        # Limit text length (prevent abuse)
        MAX_TEXT_LENGTH = 5000
        if len(text) > MAX_TEXT_LENGTH:
            return jsonify({
                'success': False,
                'error': f'Text too long. Maximum {MAX_TEXT_LENGTH} characters allowed.'
            }), 400
        
        # Create engine with specified parameters
        engine = TTSEngine(lang=lang, slow=slow)
        
        # Generate audio
        audio_path = engine.generate_audio(text, use_cache=True)
        
        if not audio_path:
            return jsonify({
                'success': False,
                'error': 'Failed to generate audio'
            }), 500
        
        # Return audio file directly if stream mode
        if stream:
            return send_file(
                audio_path,
                mimetype='audio/mpeg',
                as_attachment=False,
                download_name='speech.mp3'
            )
        
        # Return JSON with audio URL
        audio_filename = Path(audio_path).name
        audio_url = request.host_url.rstrip('/') + f'/audio/{audio_filename}'
        
        return jsonify({
            'success': True,
            'audio_url': audio_url,
            'audio_path': audio_path,
            'text_length': len(text),
            'lang': lang
        })
        
    except Exception as e:
        print(f"❌ TTS Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/audio/<path:filename>', methods=['GET'])
def serve_audio(filename):
    """
    Serve audio files from cache or output directory.
    """
    # Check in output directory first
    output_path = tts_engine.output_dir / filename
    if output_path.exists():
        return send_file(
            str(output_path),
            mimetype='audio/mpeg',
            as_attachment=False
        )
    
    # Check in cache directory
    cache_path = tts_engine.cache_dir / filename
    if cache_path.exists():
        return send_file(
            str(cache_path),
            mimetype='audio/mpeg',
            as_attachment=False
        )
    
    return jsonify({
        'success': False,
        'error': 'Audio file not found'
    }), 404


@app.route('/tts/stream', methods=['POST'])
def tts_stream():
    """
    Direct audio streaming endpoint.
    Returns audio directly without saving to file first.
    """
    try:
        data = request.get_json() or {}
        text = data.get('text', '').strip()
        lang = data.get('lang', 'id')
        slow = data.get('slow', False)
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'Text parameter is required'
            }), 400
        
        # Generate audio
        engine = TTSEngine(lang=lang, slow=slow)
        audio_path = engine.generate_audio(text, use_cache=True)
        
        if not audio_path:
            return jsonify({
                'success': False,
                'error': 'Failed to generate audio'
            }), 500
        
        # Stream the audio file
        return send_file(
            audio_path,
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='speech.mp3'
        )
        
    except Exception as e:
        print(f"❌ TTS Stream Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========================================
# Error Handlers
# ========================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


# ========================================
# Main Entry Point
# ========================================

if __name__ == '__main__':
    # Get port from environment variable (Railway/Render) or use default
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    
    print("=" * 50)
    print("🚀 Starting CarubaAI Backend Server")
    print("=" * 50)
    print(f"📁 Audio Cache: {tts_engine.cache_dir}")
    print(f"📁 Audio Output: {tts_engine.output_dir}")
    print(f"🌐 Port: {port}")
    print(f"🔧 Debug: {debug}")
    print("=" * 50)
    
    # Run the Flask app
    app.run(
        host='0.0.0.0',  # Allow connections from other devices
        port=port,
        debug=debug
    )
