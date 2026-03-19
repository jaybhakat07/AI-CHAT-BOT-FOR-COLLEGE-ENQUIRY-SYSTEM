# AI Chat Bot for College Enquiry System

A full-stack hybrid chatbot system for college enquiries. Students can get instant answers about admissions, courses, fees, and facilities through an interactive chat interface.

## Features

- **User Authentication** – Student registration and login with secure password hashing
- **Interactive Chat** – Real-time AI chatbot powered by FAQ keyword matching
- **Student Inquiry Form** – Submit formal queries; track status and admin replies
- **FAQ Knowledge Base** – Browse and search 25+ pre-loaded FAQs across 4 categories
- **Admin Panel** – Full CRUD for FAQs, respond to inquiries, manage bot responses, view user stats

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript    |
| Backend   | Python 3.8+, Flask                 |
| Database  | MySQL 5.7+                         |
| Libraries | Flask-MySQLdb, bcrypt, python-dotenv, Flask-CORS |

## Project Structure

```
AI-CHAT-BOT-FOR-COLLEGE-ENQUIRY-SYSTEM2/
├── frontend/
│   ├── index.html            # Landing page
│   ├── login.html            # User login
│   ├── register.html         # User registration
│   ├── dashboard.html        # Student dashboard
│   ├── chat.html             # Chat interface
│   ├── inquiry.html          # Inquiry form & history
│   ├── faq.html              # FAQ browser
│   ├── admin_login.html      # Admin login
│   ├── admin_dashboard.html  # Admin panel
│   ├── css/
│   │   ├── style.css         # Main styles
│   │   ├── responsive.css    # Responsive design
│   │   └── admin.css         # Admin-specific styles
│   └── js/
│       ├── api.js            # API call helpers
│       ├── main.js           # Shared utilities
│       ├── auth.js           # Authentication logic
│       ├── chat.js           # Chat functionality
│       └── admin.js          # Admin panel logic
│
├── backend/
│   ├── app.py                # Flask application entry point
│   ├── config.py             # Configuration
│   ├── database.py           # MySQL connection
│   ├── models.py             # Database models
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment variables template
│   ├── routes/
│   │   ├── auth.py           # Authentication endpoints
│   │   ├── chat.py           # Chat endpoints
│   │   ├── faq.py            # FAQ endpoints
│   │   ├── inquiry.py        # Inquiry endpoints
│   │   └── admin.py          # Admin endpoints
│   ├── utils/
│   │   ├── helpers.py        # Password hashing, validation, bot logic
│   │   └── decorators.py     # login_required / admin_required decorators
│   └── migrations/
│       └── schema.sql        # Database schema + seed data
│
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.8+
- MySQL 5.7+ (running locally)
- A web browser (or VS Code Live Server)

### 1. Database Setup

```sql
mysql -u root -p < backend/migrations/schema.sql
```

This creates the `college_chatbot` database with all tables and sample FAQs.

### 2. Backend Setup

```bash
cd backend

# Copy environment variables
cp .env.example .env
# Edit .env and set your DB_PASSWORD and SECRET_KEY

# Install dependencies
pip install -r requirements.txt

# Run the Flask server
python app.py
```

The API will be available at `http://localhost:5000`.

### 3. Frontend Setup

Open `frontend/index.html` in a browser, or use VS Code Live Server (recommended).

> **Note**: If using Live Server (port 5500), CORS is already configured. For other ports, update the `origins` list in `backend/app.py`.

### Default Admin Credentials

| Field    | Value                 |
|----------|-----------------------|
| Email    | admin@college.edu     |
| Password | admin123              |

> ⚠️ **Change the default admin password in production.**

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint       | Description          |
|--------|----------------|----------------------|
| POST   | `/register`    | Student registration |
| POST   | `/login`       | User login           |
| POST   | `/logout`      | User logout          |
| GET    | `/profile`     | Get profile          |
| PUT    | `/profile`     | Update profile       |
| GET    | `/check`       | Check session        |

### Chat (`/api/chat`)
| Method | Endpoint    | Description             |
|--------|-------------|-------------------------|
| POST   | `/send`     | Send message, get reply |
| GET    | `/history`  | Get chat history        |

### FAQs (`/api/faqs`)
| Method | Endpoint    | Description              |
|--------|-------------|--------------------------|
| GET    | `/`         | List FAQs (with filters) |
| GET    | `/<id>`     | Get single FAQ           |
| GET    | `/categories` | List categories        |

### Inquiries (`/api/inquiries`)
| Method | Endpoint    | Description             |
|--------|-------------|-------------------------|
| POST   | `/`         | Submit inquiry          |
| GET    | `/`         | Get my inquiries        |
| GET    | `/<id>`     | Get inquiry by ID       |

### Admin (`/api/admin`)
| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| POST   | `/login`              | Admin login           |
| GET    | `/dashboard`          | Dashboard stats       |
| GET/POST | `/faqs`             | List / create FAQs    |
| PUT/DELETE | `/faqs/<id>`      | Update / delete FAQ   |
| GET    | `/inquiries`          | List all inquiries    |
| PUT    | `/inquiries/<id>`     | Reply to inquiry      |
| GET    | `/users`              | List all users        |
| GET/POST | `/responses`        | Manage bot responses  |

## Environment Variables

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=college_chatbot
SECRET_KEY=your_secret_key_here
DEBUG=True
PORT=5000
```

## Security Notes

- Passwords are hashed with bcrypt
- SQL injection is prevented via parameterized queries
- Session-based authentication with `HttpOnly` cookies
- Input sanitization on all endpoints
- Admin and user sessions are separate
