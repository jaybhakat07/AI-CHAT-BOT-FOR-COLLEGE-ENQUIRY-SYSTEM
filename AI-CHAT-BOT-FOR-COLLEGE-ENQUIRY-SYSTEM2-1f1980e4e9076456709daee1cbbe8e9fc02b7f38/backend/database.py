from flask_mysqldb import MySQL

mysql = MySQL()


def init_db(app):
    """Initialize database connection with the Flask app."""
    mysql.init_app(app)
    return mysql


def get_cursor():
    """Get a database cursor."""
    return mysql.connection.cursor()
