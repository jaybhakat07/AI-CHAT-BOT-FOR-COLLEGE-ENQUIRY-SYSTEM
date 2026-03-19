from flask import Blueprint, request, jsonify, session
from models import UserModel
from utils.helpers import hash_password, check_password, validate_email, validate_password, validate_phone, sanitize_input, success_response, error_response
from utils.decorators import login_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    email = sanitize_input(data.get('email', ''))
    password = data.get('password', '')
    full_name = sanitize_input(data.get('full_name', ''))
    phone = sanitize_input(data.get('phone', ''))

    if not email or not password or not full_name:
        return jsonify(error_response('Email, password, and full name are required')[0]), 400

    if not validate_email(email):
        return jsonify(error_response('Invalid email format')[0]), 400

    if not validate_password(password):
        return jsonify(error_response('Password must be at least 6 characters')[0]), 400

    if phone and not validate_phone(phone):
        return jsonify(error_response('Invalid phone number format')[0]), 400

    existing_user = UserModel.find_by_email(email)
    if existing_user:
        return jsonify(error_response('Email already registered')[0]), 409

    password_hash = hash_password(password)
    user_id = UserModel.create(email, password_hash, full_name, phone or None)

    session['user_id'] = user_id
    session['user_email'] = email
    session['user_name'] = full_name
    session.permanent = True

    resp, status = success_response('Registration successful', {
        'user_id': user_id,
        'email': email,
        'full_name': full_name
    }, 201)
    return jsonify(resp), status


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    email = sanitize_input(data.get('email', ''))
    password = data.get('password', '')

    if not email or not password:
        return jsonify(error_response('Email and password are required')[0]), 400

    user = UserModel.find_by_email(email)
    if not user or not check_password(password, user['password_hash']):
        return jsonify(error_response('Invalid email or password')[0]), 401

    session['user_id'] = user['user_id']
    session['user_email'] = user['email']
    session['user_name'] = user['full_name']
    session.permanent = True

    resp, status = success_response('Login successful', {
        'user_id': user['user_id'],
        'email': user['email'],
        'full_name': user['full_name']
    })
    return jsonify(resp), status


@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    resp, status = success_response('Logged out successfully')
    return jsonify(resp), status


@auth_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    user = UserModel.find_by_id(session['user_id'])
    if not user:
        return jsonify(error_response('User not found')[0]), 404

    # Convert datetime to string for JSON serialization
    user_data = dict(user)
    for key in ('created_at', 'updated_at'):
        if key in user_data and user_data[key]:
            user_data[key] = str(user_data[key])

    resp, status = success_response('Profile retrieved', user_data)
    return jsonify(resp), status


@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json()
    if not data:
        return jsonify(error_response('No data provided')[0]), 400

    full_name = sanitize_input(data.get('full_name', ''))
    phone = sanitize_input(data.get('phone', ''))

    if not full_name:
        return jsonify(error_response('Full name is required')[0]), 400

    if phone and not validate_phone(phone):
        return jsonify(error_response('Invalid phone number format')[0]), 400

    UserModel.update(session['user_id'], full_name, phone or None)
    session['user_name'] = full_name

    resp, status = success_response('Profile updated successfully')
    return jsonify(resp), status


@auth_bp.route('/check', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        return jsonify(success_response('Authenticated', {
            'user_id': session['user_id'],
            'email': session.get('user_email'),
            'full_name': session.get('user_name')
        })[0])
    return jsonify(error_response('Not authenticated')[0]), 401
