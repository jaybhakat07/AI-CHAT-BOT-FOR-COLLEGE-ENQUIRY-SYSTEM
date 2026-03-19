from flask import Blueprint, request, jsonify, session
from models import AdminModel, FAQModel, InquiryModel, UserModel, ResponseModel
from utils.helpers import check_password, sanitize_input, success_response, error_response, paginate_response
from utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__)

VALID_CATEGORIES = ['admissions', 'courses', 'fees', 'facilities']


@admin_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    email = sanitize_input(data.get('email', ''))
    password = data.get('password', '')

    if not email or not password:
        return jsonify(error_response('Email and password are required')[0]), 400

    admin = AdminModel.find_by_email(email)
    if not admin or not check_password(password, admin['password_hash']):
        return jsonify(error_response('Invalid email or password')[0]), 401

    session['admin_id'] = admin['admin_id']
    session['admin_email'] = admin['email']
    session['admin_name'] = admin['full_name']
    session.permanent = True

    resp, status = success_response('Admin login successful', {
        'admin_id': admin['admin_id'],
        'email': admin['email'],
        'full_name': admin['full_name']
    })
    return jsonify(resp), status


@admin_bp.route('/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_id', None)
    session.pop('admin_email', None)
    session.pop('admin_name', None)
    resp, status = success_response('Admin logged out successfully')
    return jsonify(resp), status


@admin_bp.route('/check', methods=['GET'])
def admin_check():
    if 'admin_id' in session:
        return jsonify(success_response('Authenticated', {
            'admin_id': session['admin_id'],
            'email': session.get('admin_email'),
            'full_name': session.get('admin_name')
        })[0])
    return jsonify(error_response('Not authenticated')[0]), 401


@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    from database import get_cursor
    cur = get_cursor()

    cur.execute("SELECT COUNT(*) as total FROM users")
    total_users = cur.fetchone()['total']

    cur.execute("SELECT COUNT(*) as total FROM inquiries")
    total_inquiries = cur.fetchone()['total']

    cur.execute("SELECT COUNT(*) as total FROM inquiries WHERE status = 'pending'")
    pending_inquiries = cur.fetchone()['total']

    cur.execute("SELECT COUNT(*) as total FROM faqs")
    total_faqs = cur.fetchone()['total']

    cur.execute("SELECT COUNT(*) as total FROM chat_history")
    total_chats = cur.fetchone()['total']

    cur.execute(
        "SELECT COUNT(*) as total FROM inquiries WHERE status = 'resolved'"
    )
    resolved_inquiries = cur.fetchone()['total']

    stats = {
        'total_users': total_users,
        'total_inquiries': total_inquiries,
        'pending_inquiries': pending_inquiries,
        'resolved_inquiries': resolved_inquiries,
        'total_faqs': total_faqs,
        'total_chats': total_chats
    }
    resp, status = success_response('Dashboard data retrieved', stats)
    return jsonify(resp), status


# ── FAQ Management ──────────────────────────────────────────────────────────

@admin_bp.route('/faqs', methods=['GET'])
@admin_required
def get_faqs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    faqs, total = FAQModel.get_all(page, per_page)

    for faq in faqs:
        for key in ('created_at', 'updated_at'):
            if key in faq and faq[key]:
                faq[key] = str(faq[key])

    result = paginate_response(faqs, total, page, per_page)
    resp, status = success_response('FAQs retrieved', result)
    return jsonify(resp), status


@admin_bp.route('/faqs', methods=['POST'])
@admin_required
def create_faq():
    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    category = sanitize_input(data.get('category', ''))
    question = sanitize_input(data.get('question', ''))
    answer = sanitize_input(data.get('answer', ''))
    keywords = sanitize_input(data.get('keywords', ''))

    if not category or not question or not answer:
        return jsonify(error_response('Category, question, and answer are required')[0]), 400

    if category not in VALID_CATEGORIES:
        return jsonify(error_response(f'Invalid category')[0]), 400

    faq_id = FAQModel.create(category, question, answer, keywords or None)
    resp, status = success_response('FAQ created successfully', {'faq_id': faq_id}, 201)
    return jsonify(resp), status


@admin_bp.route('/faqs/<int:faq_id>', methods=['PUT'])
@admin_required
def update_faq(faq_id):
    faq = FAQModel.find_by_id(faq_id)
    if not faq:
        return jsonify(error_response('FAQ not found')[0]), 404

    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    category = sanitize_input(data.get('category', faq['category']))
    question = sanitize_input(data.get('question', faq['question']))
    answer = sanitize_input(data.get('answer', faq['answer']))
    keywords = sanitize_input(data.get('keywords', faq.get('keywords', '')))

    if category not in VALID_CATEGORIES:
        return jsonify(error_response('Invalid category')[0]), 400

    FAQModel.update(faq_id, category, question, answer, keywords or None)
    resp, status = success_response('FAQ updated successfully')
    return jsonify(resp), status


@admin_bp.route('/faqs/<int:faq_id>', methods=['DELETE'])
@admin_required
def delete_faq(faq_id):
    faq = FAQModel.find_by_id(faq_id)
    if not faq:
        return jsonify(error_response('FAQ not found')[0]), 404

    FAQModel.delete(faq_id)
    resp, status = success_response('FAQ deleted successfully')
    return jsonify(resp), status


# ── Inquiry Management ───────────────────────────────────────────────────────

@admin_bp.route('/inquiries', methods=['GET'])
@admin_required
def get_inquiries():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    inquiries, total = InquiryModel.get_all(page, per_page)

    for inq in inquiries:
        for key in ('created_at', 'updated_at'):
            if key in inq and inq[key]:
                inq[key] = str(inq[key])

    result = paginate_response(inquiries, total, page, per_page)
    resp, status = success_response('Inquiries retrieved', result)
    return jsonify(resp), status


@admin_bp.route('/inquiries/<int:inquiry_id>', methods=['PUT'])
@admin_required
def update_inquiry(inquiry_id):
    inquiry = InquiryModel.find_by_id(inquiry_id)
    if not inquiry:
        return jsonify(error_response('Inquiry not found')[0]), 404

    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    status_val = sanitize_input(data.get('status', ''))
    admin_reply = sanitize_input(data.get('admin_reply', ''))

    if status_val and status_val not in ['pending', 'resolved']:
        return jsonify(error_response('Invalid status')[0]), 400

    InquiryModel.update_status(inquiry_id, status_val or inquiry['status'], admin_reply or None)
    resp, status = success_response('Inquiry updated successfully')
    return jsonify(resp), status


# ── User Management ──────────────────────────────────────────────────────────

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    users, total = UserModel.get_all(page, per_page)

    for user in users:
        for key in ('created_at', 'updated_at'):
            if key in user and user[key]:
                user[key] = str(user[key])

    result = paginate_response(users, total, page, per_page)
    resp, status = success_response('Users retrieved', result)
    return jsonify(resp), status


# ── Response Management ──────────────────────────────────────────────────────

@admin_bp.route('/responses', methods=['GET'])
@admin_required
def get_responses():
    responses = ResponseModel.get_all()
    for r in responses:
        if 'created_at' in r and r['created_at']:
            r['created_at'] = str(r['created_at'])
    resp, status = success_response('Responses retrieved', responses)
    return jsonify(resp), status


@admin_bp.route('/responses', methods=['POST'])
@admin_required
def create_response():
    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    query_type = sanitize_input(data.get('query_type', ''))
    bot_response = sanitize_input(data.get('bot_response', ''))

    if not query_type or not bot_response:
        return jsonify(error_response('Query type and bot response are required')[0]), 400

    response_id = ResponseModel.create(query_type, bot_response, session['admin_id'])
    resp, status = success_response('Response created', {'response_id': response_id}, 201)
    return jsonify(resp), status


@admin_bp.route('/responses/<int:response_id>', methods=['PUT'])
@admin_required
def update_response(response_id):
    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    query_type = sanitize_input(data.get('query_type', ''))
    bot_response = sanitize_input(data.get('bot_response', ''))

    if not query_type or not bot_response:
        return jsonify(error_response('Query type and bot response are required')[0]), 400

    ResponseModel.update(response_id, query_type, bot_response)
    resp, status = success_response('Response updated successfully')
    return jsonify(resp), status


@admin_bp.route('/responses/<int:response_id>', methods=['DELETE'])
@admin_required
def delete_response(response_id):
    ResponseModel.delete(response_id)
    resp, status = success_response('Response deleted successfully')
    return jsonify(resp), status
