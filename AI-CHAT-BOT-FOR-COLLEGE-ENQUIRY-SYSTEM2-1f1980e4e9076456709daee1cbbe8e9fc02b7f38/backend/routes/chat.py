from flask import Blueprint, request, jsonify, session
from models import ChatHistoryModel, FAQModel, ResponseModel
from utils.helpers import sanitize_input, success_response, error_response, find_faq_match
from utils.decorators import login_required

chat_bp = Blueprint('chat', __name__)


def get_bot_response(message):
    """Generate bot response based on user message."""
    message_lower = message.lower().strip()

    # Check for greetings
    greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste']
    if any(g in message_lower for g in greetings):
        response = ResponseModel.get_by_type('greeting')
        if response:
            return response['bot_response']
        return "Hello! Welcome to College Enquiry System. How can I help you today?"

    # Check for farewells
    farewells = ['bye', 'goodbye', 'thank you', 'thanks', 'see you', 'farewell']
    if any(f in message_lower for f in farewells):
        response = ResponseModel.get_by_type('farewell')
        if response:
            return response['bot_response']
        return "Thank you for using our enquiry system. Have a great day!"

    # Check for contact info
    contact_keywords = ['contact', 'phone', 'email', 'address', 'location', 'office']
    if any(k in message_lower for k in contact_keywords):
        response = ResponseModel.get_by_type('contact')
        if response:
            return response['bot_response']

    # Determine category from keywords
    category = None
    if any(k in message_lower for k in ['admission', 'apply', 'application', 'eligibility', 'entrance', 'document']):
        category = 'admissions'
    elif any(k in message_lower for k in ['course', 'program', 'degree', 'btech', 'mba', 'bca', 'specialization', 'branch']):
        category = 'courses'
    elif any(k in message_lower for k in ['fee', 'cost', 'payment', 'scholarship', 'hostel fee', 'tuition', 'installment']):
        category = 'fees'
    elif any(k in message_lower for k in ['facility', 'sport', 'library', 'hostel', 'lab', 'placement', 'campus']):
        category = 'facilities'

    # Search FAQs
    if category:
        faqs = FAQModel.get_by_category(category)
    else:
        faqs, _ = FAQModel.get_all(per_page=100)

    match = find_faq_match(message, faqs)
    if match:
        return match['answer']

    # Default response
    response = ResponseModel.get_by_type('unknown')
    if response:
        return response['bot_response']
    return ("I'm sorry, I couldn't find a specific answer to your question. "
            "Please try rephrasing or submit a formal inquiry through our inquiry form.")


@chat_bp.route('/send', methods=['POST'])
@login_required
def send_message():
    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    message = sanitize_input(data.get('message', ''))
    if not message:
        return jsonify(error_response('Message cannot be empty')[0]), 400

    if len(message) > 1000:
        return jsonify(error_response('Message too long (max 1000 characters)')[0]), 400

    user_id = session['user_id']

    # Save user message
    ChatHistoryModel.save(user_id, message, 'user')

    # Generate bot response
    bot_message = get_bot_response(message)

    # Save bot response
    ChatHistoryModel.save(user_id, bot_message, 'bot')

    resp, status = success_response('Message sent', {
        'user_message': message,
        'bot_response': bot_message
    })
    return jsonify(resp), status


@chat_bp.route('/history', methods=['GET'])
@login_required
def get_history():
    user_id = session['user_id']
    limit = request.args.get('limit', 50, type=int)
    limit = min(limit, 200)  # Cap at 200

    history = ChatHistoryModel.get_by_user(user_id, limit)

    # Serialize datetime
    for item in history:
        if 'timestamp' in item and item['timestamp']:
            item['timestamp'] = str(item['timestamp'])

    resp, status = success_response('Chat history retrieved', history)
    return jsonify(resp), status


@chat_bp.route('/clear', methods=['DELETE'])
@login_required
def clear_history():
    # We don't delete history from DB for record keeping,
    # this just returns success (frontend clears display)
    resp, status = success_response('Chat display cleared')
    return jsonify(resp), status
