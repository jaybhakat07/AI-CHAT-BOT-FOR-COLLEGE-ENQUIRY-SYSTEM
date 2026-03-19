-- College Enquiry Chatbot Database Schema
-- MySQL 5.7+

CREATE DATABASE IF NOT EXISTS college_chatbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE college_chatbot;

-- Users table (students)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
    faq_id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('admissions', 'courses', 'fees', 'facilities') NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    inquiry_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('admissions', 'courses', 'fees', 'facilities') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    admin_reply TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    sender ENUM('user', 'bot') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Responses table (custom bot responses managed by admin)
CREATE TABLE IF NOT EXISTS responses (
    response_id INT AUTO_INCREMENT PRIMARY KEY,
    query_type VARCHAR(100) NOT NULL,
    bot_response TEXT NOT NULL,
    admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE SET NULL
);

-- Seed data: Default admin account (password: admin123)
INSERT IGNORE INTO admins (email, password_hash, full_name) VALUES
('admin@college.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJSX4Qb2', 'System Administrator');

-- Seed data: Sample FAQs - Admissions
INSERT IGNORE INTO faqs (category, question, answer, keywords) VALUES
('admissions', 'What are the admission requirements?', 'To be admitted, students must have completed their 10+2 with a minimum of 60% marks. You also need to submit the application form, mark sheets, and a character certificate.', 'admission requirements, eligibility, 10+2, marks'),
('admissions', 'When does the admission process start?', 'Admission process typically starts in June every year. Applications are accepted from June to August. Please check our official website for exact dates.', 'admission dates, when, start, timeline'),
('admissions', 'What documents are required for admission?', 'Required documents: 10th mark sheet, 12th mark sheet, Transfer Certificate, Character Certificate, 4 passport-size photos, Aadhar card copy, and Caste Certificate (if applicable).', 'documents, required, admission, certificates'),
('admissions', 'Is there an entrance exam?', 'Yes, we conduct an entrance exam for specific programs like Engineering and Management. The entrance test is conducted annually in May. Visit our admissions office for more details.', 'entrance exam, test, eligibility'),
('admissions', 'How can I apply for admission?', 'You can apply online through our official website or visit the admissions office in person. The application form is available online and at the college office.', 'apply, application form, online, offline'),

-- Seed data: Sample FAQs - Courses
('courses', 'What courses does the college offer?', 'We offer undergraduate programs in Engineering (B.Tech), Management (BBA/MBA), Science (B.Sc), Commerce (B.Com), Arts (BA), and Computer Applications (BCA/MCA).', 'courses, programs, undergraduate, postgraduate'),
('courses', 'What is the duration of the B.Tech program?', 'The B.Tech program is a 4-year full-time program. It includes 8 semesters with a mandatory internship in the 7th semester.', 'btech, duration, engineering, 4 years'),
('courses', 'Are there any online courses available?', 'Yes, we offer some online certificate courses through our e-learning platform. These include courses in Data Science, Digital Marketing, and Programming.', 'online courses, e-learning, certificate'),
('courses', 'What specializations are available in Engineering?', 'Available specializations: Computer Science & Engineering, Mechanical Engineering, Civil Engineering, Electrical Engineering, and Electronics & Communication Engineering.', 'engineering, specialization, branches, cse, mechanical'),
('courses', 'Does the college offer MBA?', 'Yes, we offer a 2-year full-time MBA program with specializations in Finance, Marketing, Human Resources, and Operations Management.', 'mba, management, postgraduate, 2 years'),

-- Seed data: Sample FAQs - Fees
('fees', 'What is the tuition fee for B.Tech?', 'The annual tuition fee for B.Tech is Rs. 85,000 per year. This includes library fees, lab fees, and other academic charges. Hostel fees are separate.', 'btech fees, tuition, annual fee, cost'),
('fees', 'Are scholarships available?', 'Yes! We offer merit scholarships for students scoring above 85% in 12th standard. Government scholarships (SC/ST/OBC) are also available. Contact our scholarship cell for details.', 'scholarship, financial aid, merit, discount'),
('fees', 'What are the hostel fees?', 'Hostel fees are Rs. 45,000 per year for a shared room (3 sharing) and Rs. 60,000 for double sharing. This includes accommodation and mess charges.', 'hostel fee, accommodation, mess, room'),
('fees', 'Is there an option for fee installments?', 'Yes, we allow fee payment in 2 installments per semester. The first installment is due at the beginning of the semester and the second after 2 months.', 'installment, payment, fee structure'),
('fees', 'What is the fee for MBA program?', 'The MBA program fee is Rs. 1,20,000 per year. This covers tuition, library access, and study materials. Additional charges may apply for workshops and seminars.', 'mba fee, management fees, cost'),

-- Seed data: Sample FAQs - Facilities
('facilities', 'What sports facilities are available?', 'We have excellent sports facilities including a cricket ground, football field, basketball court, badminton court, indoor sports hall, and a swimming pool.', 'sports, cricket, football, basketball, gym, pool'),
('facilities', 'Is there a hostel facility?', 'Yes, we provide separate hostel facilities for boys and girls with 24/7 security, Wi-Fi, common rooms, and mess facilities. The hostel can accommodate up to 500 students.', 'hostel, accommodation, boys, girls, security'),
('facilities', 'What library resources are available?', 'Our library has over 50,000 books, access to 200+ online journals, digital library with e-books, study rooms, and a computer section with 50 terminals.', 'library, books, journals, digital, resources'),
('facilities', 'Does the college have a placement cell?', 'Yes, our placement cell actively works with 200+ companies. Last year, 90% of eligible students were placed with an average package of Rs. 6 LPA and highest package of Rs. 18 LPA.', 'placement, job, companies, salary, package, campus'),
('facilities', 'What are the laboratory facilities?', 'We have state-of-the-art laboratories for all departments including Computer Labs (500+ systems), Physics Lab, Chemistry Lab, Electronics Lab, and CAD/CAM Lab.', 'lab, laboratory, computer, physics, chemistry, facilities');

-- Seed data: Sample custom responses
INSERT IGNORE INTO responses (query_type, bot_response) VALUES
('greeting', 'Hello! Welcome to College Enquiry System. I am here to help you with information about admissions, courses, fees, and facilities. How can I assist you today?'),
('farewell', 'Thank you for using our enquiry system. Have a great day! Feel free to come back if you have more questions.'),
('unknown', 'I am sorry, I could not find a specific answer to your question. Please try rephrasing your query or submit a formal inquiry through our inquiry form, and our staff will get back to you shortly.'),
('contact', 'You can contact us at: Email: info@college.edu | Phone: +91-1234567890 | Address: College Campus, City - 000000 | Office Hours: Mon-Sat, 9 AM to 5 PM');
