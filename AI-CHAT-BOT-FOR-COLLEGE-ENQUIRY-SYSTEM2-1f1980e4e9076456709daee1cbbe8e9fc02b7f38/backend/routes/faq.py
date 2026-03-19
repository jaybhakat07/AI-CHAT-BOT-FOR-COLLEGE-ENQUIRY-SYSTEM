from flask import Blueprint, request, jsonify
from models import FAQModel
from utils.helpers import sanitize_input, success_response, error_response, paginate_response

faq_bp = Blueprint('faq', __name__)

VALID_CATEGORIES = ['admissions', 'courses', 'fees', 'facilities']


@faq_bp.route('/', methods=['GET'])
def get_faqs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    category = request.args.get('category', '')
    search = request.args.get('search', '')

    if search:
        faqs = FAQModel.search(sanitize_input(search))
        total = len(faqs)
        # Manual pagination for search results
        start = (page - 1) * per_page
        faqs = faqs[start:start + per_page]
    elif category and category in VALID_CATEGORIES:
        faqs = FAQModel.get_by_category(category)
        total = len(faqs)
        start = (page - 1) * per_page
        faqs = faqs[start:start + per_page]
    else:
        faqs, total = FAQModel.get_all(page, per_page)

    # Serialize datetimes
    for faq in faqs:
        for key in ('created_at', 'updated_at'):
            if key in faq and faq[key]:
                faq[key] = str(faq[key])

    result = paginate_response(faqs, total, page, per_page)
    resp, status = success_response('FAQs retrieved', result)
    return jsonify(resp), status


@faq_bp.route('/<int:faq_id>', methods=['GET'])
def get_faq(faq_id):
    faq = FAQModel.find_by_id(faq_id)
    if not faq:
        return jsonify(error_response('FAQ not found')[0]), 404

    faq = dict(faq)
    for key in ('created_at', 'updated_at'):
        if key in faq and faq[key]:
            faq[key] = str(faq[key])

    resp, status = success_response('FAQ retrieved', faq)
    return jsonify(resp), status


@faq_bp.route('/categories', methods=['GET'])
def get_categories():
    resp, status = success_response('Categories retrieved', VALID_CATEGORIES)
    return jsonify(resp), status
