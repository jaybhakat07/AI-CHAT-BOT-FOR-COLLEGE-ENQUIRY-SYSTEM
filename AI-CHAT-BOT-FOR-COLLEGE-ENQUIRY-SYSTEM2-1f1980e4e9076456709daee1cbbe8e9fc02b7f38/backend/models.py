from database import get_cursor, mysql
from datetime import datetime


class UserModel:
    @staticmethod
    def create(email, password_hash, full_name, phone=None):
        cur = get_cursor()
        cur.execute(
            "INSERT INTO users (email, password_hash, full_name, phone) VALUES (%s, %s, %s, %s)",
            (email, password_hash, full_name, phone)
        )
        mysql.connection.commit()
        return cur.lastrowid

    @staticmethod
    def find_by_email(email):
        cur = get_cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cur.fetchone()

    @staticmethod
    def find_by_id(user_id):
        cur = get_cursor()
        cur.execute("SELECT user_id, email, full_name, phone, created_at FROM users WHERE user_id = %s", (user_id,))
        return cur.fetchone()

    @staticmethod
    def update(user_id, full_name, phone):
        cur = get_cursor()
        cur.execute(
            "UPDATE users SET full_name = %s, phone = %s WHERE user_id = %s",
            (full_name, phone, user_id)
        )
        mysql.connection.commit()

    @staticmethod
    def get_all(page=1, per_page=20):
        offset = (page - 1) * per_page
        cur = get_cursor()
        cur.execute(
            "SELECT user_id, email, full_name, phone, created_at FROM users ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (per_page, offset)
        )
        users = cur.fetchall()
        cur.execute("SELECT COUNT(*) as total FROM users")
        total = cur.fetchone()['total']
        return users, total


class AdminModel:
    @staticmethod
    def find_by_email(email):
        cur = get_cursor()
        cur.execute("SELECT * FROM admins WHERE email = %s", (email,))
        return cur.fetchone()

    @staticmethod
    def find_by_id(admin_id):
        cur = get_cursor()
        cur.execute("SELECT admin_id, email, full_name, created_at FROM admins WHERE admin_id = %s", (admin_id,))
        return cur.fetchone()


class FAQModel:
    @staticmethod
    def get_all(page=1, per_page=20):
        offset = (page - 1) * per_page
        cur = get_cursor()
        cur.execute(
            "SELECT * FROM faqs ORDER BY category, faq_id LIMIT %s OFFSET %s",
            (per_page, offset)
        )
        faqs = cur.fetchall()
        cur.execute("SELECT COUNT(*) as total FROM faqs")
        total = cur.fetchone()['total']
        return faqs, total

    @staticmethod
    def get_by_category(category):
        cur = get_cursor()
        cur.execute("SELECT * FROM faqs WHERE category = %s ORDER BY faq_id", (category,))
        return cur.fetchall()

    @staticmethod
    def search(query):
        cur = get_cursor()
        like_query = f"%{query}%"
        cur.execute(
            """SELECT * FROM faqs
               WHERE question LIKE %s OR answer LIKE %s OR keywords LIKE %s
               ORDER BY faq_id""",
            (like_query, like_query, like_query)
        )
        return cur.fetchall()

    @staticmethod
    def find_by_id(faq_id):
        cur = get_cursor()
        cur.execute("SELECT * FROM faqs WHERE faq_id = %s", (faq_id,))
        return cur.fetchone()

    @staticmethod
    def create(category, question, answer, keywords=None):
        cur = get_cursor()
        cur.execute(
            "INSERT INTO faqs (category, question, answer, keywords) VALUES (%s, %s, %s, %s)",
            (category, question, answer, keywords)
        )
        mysql.connection.commit()
        return cur.lastrowid

    @staticmethod
    def update(faq_id, category, question, answer, keywords=None):
        cur = get_cursor()
        cur.execute(
            "UPDATE faqs SET category=%s, question=%s, answer=%s, keywords=%s WHERE faq_id=%s",
            (category, question, answer, keywords, faq_id)
        )
        mysql.connection.commit()

    @staticmethod
    def delete(faq_id):
        cur = get_cursor()
        cur.execute("DELETE FROM faqs WHERE faq_id = %s", (faq_id,))
        mysql.connection.commit()


class InquiryModel:
    @staticmethod
    def create(user_id, category, subject, message):
        cur = get_cursor()
        cur.execute(
            "INSERT INTO inquiries (user_id, category, subject, message) VALUES (%s, %s, %s, %s)",
            (user_id, category, subject, message)
        )
        mysql.connection.commit()
        return cur.lastrowid

    @staticmethod
    def get_by_user(user_id, page=1, per_page=10):
        offset = (page - 1) * per_page
        cur = get_cursor()
        cur.execute(
            "SELECT * FROM inquiries WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (user_id, per_page, offset)
        )
        inquiries = cur.fetchall()
        cur.execute("SELECT COUNT(*) as total FROM inquiries WHERE user_id = %s", (user_id,))
        total = cur.fetchone()['total']
        return inquiries, total

    @staticmethod
    def get_all(page=1, per_page=20):
        offset = (page - 1) * per_page
        cur = get_cursor()
        cur.execute(
            """SELECT i.*, u.full_name, u.email
               FROM inquiries i JOIN users u ON i.user_id = u.user_id
               ORDER BY i.created_at DESC LIMIT %s OFFSET %s""",
            (per_page, offset)
        )
        inquiries = cur.fetchall()
        cur.execute("SELECT COUNT(*) as total FROM inquiries")
        total = cur.fetchone()['total']
        return inquiries, total

    @staticmethod
    def find_by_id(inquiry_id):
        cur = get_cursor()
        cur.execute(
            """SELECT i.*, u.full_name, u.email
               FROM inquiries i JOIN users u ON i.user_id = u.user_id
               WHERE i.inquiry_id = %s""",
            (inquiry_id,)
        )
        return cur.fetchone()

    @staticmethod
    def update_status(inquiry_id, status, admin_reply=None):
        cur = get_cursor()
        cur.execute(
            "UPDATE inquiries SET status=%s, admin_reply=%s WHERE inquiry_id=%s",
            (status, admin_reply, inquiry_id)
        )
        mysql.connection.commit()


class ChatHistoryModel:
    @staticmethod
    def save(user_id, message, sender):
        cur = get_cursor()
        cur.execute(
            "INSERT INTO chat_history (user_id, message, sender) VALUES (%s, %s, %s)",
            (user_id, message, sender)
        )
        mysql.connection.commit()
        return cur.lastrowid

    @staticmethod
    def get_by_user(user_id, limit=50):
        cur = get_cursor()
        cur.execute(
            "SELECT * FROM chat_history WHERE user_id = %s ORDER BY timestamp DESC LIMIT %s",
            (user_id, limit)
        )
        history = cur.fetchall()
        return list(reversed(history))


class ResponseModel:
    @staticmethod
    def get_by_type(query_type):
        cur = get_cursor()
        cur.execute("SELECT * FROM responses WHERE query_type = %s", (query_type,))
        return cur.fetchone()

    @staticmethod
    def get_all():
        cur = get_cursor()
        cur.execute("SELECT * FROM responses ORDER BY created_at DESC")
        return cur.fetchall()

    @staticmethod
    def create(query_type, bot_response, admin_id):
        cur = get_cursor()
        cur.execute(
            "INSERT INTO responses (query_type, bot_response, admin_id) VALUES (%s, %s, %s)",
            (query_type, bot_response, admin_id)
        )
        mysql.connection.commit()
        return cur.lastrowid

    @staticmethod
    def update(response_id, query_type, bot_response):
        cur = get_cursor()
        cur.execute(
            "UPDATE responses SET query_type=%s, bot_response=%s WHERE response_id=%s",
            (query_type, bot_response, response_id)
        )
        mysql.connection.commit()

    @staticmethod
    def delete(response_id):
        cur = get_cursor()
        cur.execute("DELETE FROM responses WHERE response_id = %s", (response_id,))
        mysql.connection.commit()
