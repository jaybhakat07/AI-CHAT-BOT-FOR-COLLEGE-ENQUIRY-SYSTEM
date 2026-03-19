from flask import Blueprint, request, jsonify, session
from models import InquiryModel
from utils.helpers import sanitize_input, success_response, error_response, paginate_response
from utils.decorators import login_required

inquiry_bp = Blueprint('inquiry', __name__)

VALID_CATEGORIES = ['admissions', 'courses', 'fees', 'facilities']


@inquiry_bp.route('/', methods=['POST'])
@login_required
def submit_inquiry():
    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    category = sanitize_input(data.get('category', ''))
    subject = sanitize_input(data.get('subject', ''))
    message = sanitize_input(data.get('message', ''))

    if not category or not subject or not message:
        return jsonify(error_response('Category, subject, and message are required')[0]), 400

    if category not in VALID_CATEGORIES:
        return jsonify(error_response(f'Invalid category. Must be one of: {", ".join(VALID_CATEGORIES)}')[0]), 400

    if len(subject) > 255:
        return jsonify(error_response('Subject too long (max 255 characters)')[0]), 400

    if len(message) > 5000:
        return jsonify(error_response('Message too long (max 5000 characters)')[0]), 400

    inquiry_id = InquiryModel.create(session['user_id'], category, subject, message)

    resp, status = success_response('Inquiry submitted successfully', {'inquiry_id': inquiry_id}, 201)
    return jsonify(resp), status


@inquiry_bp.route('/', methods=['GET'])
@login_required
def get_my_inquiries():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    inquiries, total = InquiryModel.get_by_user(session['user_id'], page, per_page)

    for inq in inquiries:
        for key in ('created_at', 'updated_at'):
            if key in inq and inq[key]:
                inq[key] = str(inq[key])

    result = paginate_response(inquiries, total, page, per_page)
    resp, status = success_response('Inquiries retrieved', result)
    return jsonify(resp), status


@inquiry_bp.route('/<int:inquiry_id>', methods=['GET'])
@login_required
def get_inquiry(inquiry_id):
    inquiry = InquiryModel.find_by_id(inquiry_id)
    if not inquiry:
        return jsonify(error_response('Inquiry not found')[0]), 404

    # Users can only view their own inquiries
    if inquiry['user_id'] != session['user_id']:
        return jsonify(error_response('Access denied')[0]), 403

    inquiry = dict(inquiry)
    for key in ('created_at', 'updated_at'):
        if key in inquiry and inquiry[key]:
            inquiry[key] = str(inquiry[key])

    resp, status = success_response('Inquiry retrieved', inquiry)
    return jsonify(resp), status
