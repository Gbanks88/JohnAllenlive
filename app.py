from flask import Flask, render_template, request, jsonify, send_file
import os
from datetime import datetime
from dateutil.parser import parse
import sqlalchemy
from sqlalchemy import create_engine, text
from routes.ai_routes import ai_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# Register blueprints
app.register_blueprint(ai_bp)

def get_db_conn():
    """Create database connection."""
    # Use SQLite for all environments temporarily
    db_path = os.path.join(os.path.dirname(__file__), 'scholarships.db')
    pool = create_engine(f'sqlite:///{db_path}')
    return pool.connect()

def init_db():
    """Initialize the database schema."""
    conn = get_db_conn()
    
    # Create scholarships table
    conn.execute(text('''
        CREATE TABLE IF NOT EXISTS scholarships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            deadline DATE NOT NULL,
            field_of_study TEXT,
            eligibility TEXT,
            requirements TEXT,
            link TEXT
        )
    '''))
    
    # Add sample data if table is empty
    result = conn.execute(text("SELECT COUNT(*) FROM scholarships")).scalar()
    if result == 0:
        conn.execute(text('''
            INSERT INTO scholarships (name, description, amount, deadline, field_of_study, eligibility, requirements, link)
            VALUES 
            ('STEM Excellence Scholarship', 
             'Award for outstanding students in STEM fields',
             10000.00,
             '2024-12-31',
             'Computer Science, Engineering',
             'Undergraduate students with GPA > 3.5',
             'Transcript, Essay, 2 Letters of Recommendation',
             'https://example.com/stem-scholarship'),
            ('Future Leaders Grant',
             'Supporting next generation of business leaders',
             5000.00,
             '2024-10-15',
             'Business Administration',
             'Business major students',
             'Business proposal, Resume',
             'https://example.com/business-grant')
        '''))
        conn.commit()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scholarships', methods=['GET'])
def get_scholarships():
    conn = get_db_conn()
    
    # Get filter parameters
    field = request.args.get('field', '')
    min_amount = request.args.get('min_amount', 0)
    deadline = request.args.get('deadline', '')
    
    # Build query
    query = "SELECT * FROM scholarships WHERE 1=1"
    params = {}
    
    if field:
        query += " AND field_of_study LIKE :field"
        params['field'] = f'%{field}%'
    
    if min_amount:
        query += " AND amount >= :min_amount"
        params['min_amount'] = float(min_amount)
    
    if deadline:
        query += " AND deadline <= :deadline"
        params['deadline'] = deadline
    
    # Execute query
    result = conn.execute(text(query), params)
    scholarships = []
    for row in result:
        scholarship = dict(row._mapping)
        scholarship['deadline'] = str(scholarship['deadline'])
        scholarships.append(scholarship)
    
    return jsonify(scholarships)

@app.route('/api/scholarships', methods=['POST'])
def add_scholarship():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'description', 'amount', 'deadline']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse and validate deadline
        try:
            deadline = parse(data['deadline']).date()
        except ValueError:
            return jsonify({'error': 'Invalid deadline format'}), 400
        
        # Insert into database
        conn = get_db_conn()
        conn.execute(text('''
            INSERT INTO scholarships (name, description, amount, deadline, field_of_study, eligibility, requirements, link)
            VALUES (:name, :description, :amount, :deadline, :field_of_study, :eligibility, :requirements, :link)
        '''), {
            'name': data['name'],
            'description': data['description'],
            'amount': float(data['amount']),
            'deadline': deadline,
            'field_of_study': data.get('field_of_study'),
            'eligibility': data.get('eligibility'),
            'requirements': data.get('requirements'),
            'link': data.get('link')
        })
        conn.commit()
        
        return jsonify({'message': 'Scholarship added successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Content pages
@app.route('/scholarship-tips')
def scholarship_tips():
    content = """
    <h2>Top Tips for Winning Scholarships</h2>
    <p class="lead">Follow these proven strategies to increase your chances of winning scholarships.</p>
    
    <h3>1. Start Early</h3>
    <p>Begin your scholarship search as early as possible. Many scholarships have deadlines months before the academic year starts.</p>
    
    <h3>2. Stay Organized</h3>
    <p>Create a spreadsheet to track application deadlines, requirements, and status of each scholarship application.</p>
    
    <h3>3. Perfect Your Essays</h3>
    <p>Write compelling essays that tell your unique story. Have others review your essays for feedback.</p>
    
    <h3>4. Meet All Requirements</h3>
    <p>Carefully read and follow all application requirements. Missing a single requirement can disqualify your application.</p>
    
    <h3>5. Apply to Multiple Scholarships</h3>
    <p>Don't put all your eggs in one basket. Apply to multiple scholarships to increase your chances of success.</p>
    """
    return render_template('content_page.html',
                         title='Scholarship Application Tips',
                         description='Learn proven strategies for winning scholarships. Get expert tips on applications, essays, and more.',
                         content=content,
                         related_articles=[
                             {'url': '/application-guide', 'title': 'Complete Scholarship Application Guide'},
                             {'url': '/resources', 'title': 'Scholarship Resources'},
                             {'url': '/blog', 'title': 'Latest Scholarship News'}
                         ])

@app.route('/application-guide')
def application_guide():
    content = """
    <h2>Complete Scholarship Application Guide</h2>
    <p class="lead">A step-by-step guide to completing successful scholarship applications.</p>
    
    <h3>Research Phase</h3>
    <ul>
        <li>Identify scholarships that match your profile</li>
        <li>Review eligibility requirements carefully</li>
        <li>Create a timeline for each application</li>
    </ul>
    
    <h3>Preparation Phase</h3>
    <ul>
        <li>Gather required documents</li>
        <li>Request letters of recommendation</li>
        <li>Prepare your resume</li>
    </ul>
    
    <h3>Writing Phase</h3>
    <ul>
        <li>Draft your essays</li>
        <li>Get feedback from teachers or mentors</li>
        <li>Revise and polish your writing</li>
    </ul>
    
    <h3>Submission Phase</h3>
    <ul>
        <li>Double-check all requirements</li>
        <li>Submit before deadlines</li>
        <li>Follow up if necessary</li>
    </ul>
    """
    return render_template('content_page.html',
                         title='Scholarship Application Guide',
                         description='Complete guide to applying for scholarships. Learn the process from research to submission.',
                         content=content,
                         related_articles=[
                             {'url': '/scholarship-tips', 'title': 'Scholarship Application Tips'},
                             {'url': '/resources', 'title': 'Scholarship Resources'},
                             {'url': '/blog', 'title': 'Latest Scholarship News'}
                         ])

@app.route('/resources')
def resources():
    content = """
    <h2>Scholarship Resources</h2>
    <p class="lead">Essential resources to help you find and win scholarships.</p>
    
    <h3>Financial Aid Resources</h3>
    <ul>
        <li>FAFSA Guide</li>
        <li>CSS Profile Tips</li>
        <li>State Aid Programs</li>
    </ul>
    
    <h3>Writing Resources</h3>
    <ul>
        <li>Essay Writing Tips</li>
        <li>Personal Statement Guide</li>
        <li>Grammar and Style Guide</li>
    </ul>
    
    <h3>Additional Resources</h3>
    <ul>
        <li>Recommendation Letter Templates</li>
        <li>Resume Building Guide</li>
        <li>Interview Preparation Tips</li>
    </ul>
    """
    return render_template('content_page.html',
                         title='Scholarship Resources',
                         description='Access essential resources for scholarship success. Find guides, templates, and tools.',
                         content=content,
                         related_articles=[
                             {'url': '/scholarship-tips', 'title': 'Scholarship Application Tips'},
                             {'url': '/application-guide', 'title': 'Complete Application Guide'},
                             {'url': '/blog', 'title': 'Latest Scholarship News'}
                         ])

@app.route('/blog')
def blog():
    content = """
    <h2>Latest Scholarship News and Updates</h2>
    <p class="lead">Stay informed about the latest scholarship opportunities and trends.</p>
    
    <article class="mb-5">
        <h3>New Scholarships for STEM Students</h3>
        <p class="text-muted">Posted on February 12, 2025</p>
        <p>Several new scholarship opportunities have been announced for students pursuing STEM degrees...</p>
        <a href="#" class="btn btn-primary btn-sm">Read More</a>
    </article>
    
    <article class="mb-5">
        <h3>How to Write a Winning Scholarship Essay</h3>
        <p class="text-muted">Posted on February 10, 2025</p>
        <p>Expert tips on crafting an essay that stands out from the competition...</p>
        <a href="#" class="btn btn-primary btn-sm">Read More</a>
    </article>
    
    <article class="mb-5">
        <h3>Understanding Merit-Based vs. Need-Based Scholarships</h3>
        <p class="text-muted">Posted on February 8, 2025</p>
        <p>Learn the key differences between merit-based and need-based scholarships...</p>
        <a href="#" class="btn btn-primary btn-sm">Read More</a>
    </article>
    """
    return render_template('content_page.html',
                         title='Scholarship Blog',
                         description='Read the latest scholarship news, tips, and updates. Stay informed about new opportunities.',
                         content=content,
                         related_articles=[
                             {'url': '/scholarship-tips', 'title': 'Scholarship Application Tips'},
                             {'url': '/application-guide', 'title': 'Complete Application Guide'},
                             {'url': '/resources', 'title': 'Scholarship Resources'}
                         ])

# Newsletter signup
@app.route('/api/newsletter/signup', methods=['POST'])
def newsletter_signup():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
            
        # Store email in database
        conn = get_db_conn()
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                signup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''))
        
        conn.execute(text('INSERT INTO newsletter_subscribers (email) VALUES (:email)'),
                    {'email': email})
        conn.commit()
        
        return jsonify({'message': 'Successfully subscribed'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Serve sitemap.xml
@app.route('/sitemap.xml')
def sitemap():
    return send_file('sitemap.xml', mimetype='application/xml')

# Serve robots.txt
@app.route('/robots.txt')
def robots():
    return send_file('robots.txt', mimetype='text/plain')

# Error handling
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
