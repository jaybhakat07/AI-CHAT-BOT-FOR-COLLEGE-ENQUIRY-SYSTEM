import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend requests
    CORS(app, supports_credentials=True, origins=['http://localhost:3000', 'http://127.0.0.1:5500', 'null'])

    # Initialize database
    init_db(app)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.chat import chat_bp
    from routes.faq import faq_bp
    from routes.inquiry import inquiry_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(faq_bp, url_prefix='/api/faqs')
    app.register_blueprint(inquiry_bp, url_prefix='/api/inquiries')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'message': 'College Enquiry Chatbot API is running'})

    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'success': False, 'message': 'Method not allowed'}), 405

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f'Internal server error: {e}')
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    logger.info(f'Starting College Enquiry Chatbot API on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug)
