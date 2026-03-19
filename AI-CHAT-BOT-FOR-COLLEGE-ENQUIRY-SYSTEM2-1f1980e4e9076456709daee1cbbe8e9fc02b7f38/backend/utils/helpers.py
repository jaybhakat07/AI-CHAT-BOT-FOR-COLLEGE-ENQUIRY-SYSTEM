import re
import bcrypt


def hash_password(password):
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_password(password, password_hash):
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password strength (minimum 6 characters)."""
    return len(password) >= 6


def validate_phone(phone):
    """Validate phone number (10 digits)."""
    if not phone:
        return True  # Phone is optional
    pattern = r'^\+?[\d\s\-]{10,15}$'
    return re.match(pattern, phone) is not None


def sanitize_input(text):
    """Basic input sanitization."""
    if text is None:
        return None
    return str(text).strip()


def paginate_response(data, total, page, per_page):
    """Create a paginated response dictionary."""
    per_page = max(1, per_page)  # guard against division by zero
    return {
        'data': data,
        'pagination': {
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        }
    }


def success_response(message, data=None, status_code=200):
    """Create a success response."""
    response = {'success': True, 'message': message}
    if data is not None:
        response['data'] = data
    return response, status_code


def error_response(message, status_code=400):
    """Create an error response."""
    return {'success': False, 'message': message}, status_code


def find_faq_match(message, faqs):
    """Find the best matching FAQ for a given message using keyword matching."""
    message_lower = message.lower()
    best_match = None
    best_score = 0

    for faq in faqs:
        score = 0
        question_lower = faq['question'].lower()
        keywords = faq.get('keywords', '') or ''
        keywords_list = [k.strip().lower() for k in keywords.split(',') if k.strip()]

        # Check keywords
        for keyword in keywords_list:
            if keyword in message_lower:
                score += 3

        # Check words in question
        question_words = question_lower.split()
        for word in question_words:
            if len(word) > 3 and word in message_lower:
                score += 1

        if score > best_score:
            best_score = score
            best_match = faq

    return best_match if best_score > 0 else None
