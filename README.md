# AI Carbon Footprint Tracker

This project is a comprehensive application for tracking and managing carbon footprint data, allowing companies to monitor their emissions and make data-driven sustainability decisions.

## Features

- User authentication and authorization
- Company and supplier management
- Carbon emissions data tracking
- Supply chain emissions monitoring
- Material emissions calculation
- Analytics and dashboard visualization

## Tech Stack

- **Backend**: FastAPI with SQLAlchemy
- **Database**: SQLite (default), PostgreSQL (optional)
- **Frontend**: React.js
- **Authentication**: JWT tokens
- **Migration**: Alembic

## Installation and Setup

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm/yarn

### Backend Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ai-carbon-footprint-tracker
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables by creating a `.env` file:
   ```
   # Database configuration
   DATABASE_URL=sqlite:///./carbon_footprint.db
   
   # JWT Settings for authentication
   SECRET_KEY=your_secure_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # Application settings
   DEBUG=True
   ENVIRONMENT=development
   ```

5. Initialize the database with Alembic:
   ```
   # Generate initial migration
   python generate_migration.py
   
   # Apply migrations
   python upgrade_db.py
   
   # Seed initial data
   python init_db.py
   ```

### Frontend Setup

1. Install frontend dependencies:
   ```
   npm install
   ```

2. Start the frontend development server:
   ```
   npm start
   ```

## Running the Application

### Start the Backend

```
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000.
API documentation will be available at http://localhost:8000/docs.

### Start the Frontend

```
npm start
```

The frontend will be available at http://localhost:3000.

## Database Management

### Create a New Migration

After changing models:

```
python generate_migration.py
```

### Apply Migrations

```
python upgrade_db.py
```

## Docker Deployment

1. Build and run with Docker Compose:
   ```
   docker-compose up -d
   ```

2. For production deployment, use:
   ```
   docker-compose -f docker-compose.prod.yml up -d
   ```

## API Documentation

Once the server is running, you can access the interactive API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development Guidelines

- Follow PEP 8 style guide for Python code
- Use React hooks and functional components for frontend
- Write tests for all new features
- Use migrations for all database changes

## License

[Your license information here]
