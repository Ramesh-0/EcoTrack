# Carbon Footprint Tracker API

Backend API for the Carbon Footprint Tracker application.

## Setup

1. Install dependencies
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example` and fill in your MongoDB URI and JWT secret

3. Run in development mode
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/profile` - Get user profile (protected)

### Emissions

- `GET /api/emissions` - Get all user emissions (protected)
- `GET /api/emissions/:id` - Get single emission by ID (protected)
- `POST /api/emissions` - Create a new emission calculation (protected)
- `DELETE /api/emissions/:id` - Delete an emission calculation (protected)

## Data Models

### User

```javascript
{
  name: String,
  email: String,
  password: String (hashed),
  isAdmin: Boolean,
  createdAt: Date
}
```

### Emission

```javascript
{
  user: ObjectId (ref: User),
  calculationType: String (enum: ['electricity', 'transportation', 'water', 'waste']),
  input: {
    amount: Number,
    unit: String,
    country: String (optional),
    vehicleType: String (optional),
    notes: String (optional)
  },
  result: {
    co2e: String,
    unit: String,
    calculation: String,
    source: String
  },
  createdAt: Date
}
``` 