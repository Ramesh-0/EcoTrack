# AI Carbon Footprint Tracker

This project is a comprehensive application for tracking and managing carbon footprint data, allowing companies to monitor their emissions and make data-driven sustainability decisions.

## Features

- User authentication and authorization
- Company and supplier management
- Carbon emissions data tracking
- Supply chain emissions monitoring
- Material emissions calculation
- Analytics and dashboard visualization
- Database storage of emissions calculations 

## Tech Stack

- **Backend**: FastAPI with SQLAlchemy, Node.js/Express API
- **Database**: SQLite (default), PostgreSQL (optional), MongoDB (for emissions storage)
- **Frontend**: React.js
- **Authentication**: JWT tokens
- **Migration**: Alembic

## Installation and Setup

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm/yarn
- MongoDB (for emissions storage)

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
   
   # AI Model Service
   MODEL_API_URL=http://localhost:8001/predict
   
   # Climaq API for emissions calculations
   REACT_APP_CLIMAQ_API_KEY=your_climaq_api_key_here
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

### MongoDB API Setup (for Emissions Storage)

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install server dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/carbon-footprint
   JWT_SECRET=your_jwt_secret
   ```

4. Start the MongoDB API server:
   ```
   npm run dev
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

### Start the Main Backend

```
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000.
API documentation will be available at http://localhost:8000/docs.

### Start the MongoDB API

```
cd server
npm run dev
```

The MongoDB API will be available at http://localhost:5000.

### Start the Frontend

```
npm start
```

The frontend will be available at http://localhost:3000.

## Database Management

### MongoDB (Emissions Data)

This application uses MongoDB to store emissions calculations. The MongoDB database includes:

- User authentication data
- Saved emissions calculations with detailed inputs and results
- Calculation history per user

### Main Database

#### Create a New Migration

After changing models:

```
python generate_migration.py
```

#### Apply Migrations

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

## External Services

### Climaq API for Emissions Calculation

The application uses the Climaq API for accurate carbon emissions calculations. To set up:

1. Register for an API key at the Climaq website (https://climaq.com)
2. Add your API key to the `.env` file:
   ```
   REACT_APP_CLIMAQ_API_KEY=your_climaq_api_key_here
   ```
3. If using Create React App, restart the development server for changes to take effect

## Development Guidelines

- Follow PEP 8 style guide for Python code
- Use React hooks and functional components for frontend
- Write tests for all new features
- Use migrations for all database changes

## License

[Your license information here]
