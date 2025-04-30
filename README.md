# Meditation Center Attendance Application

A lightweight, multi-tenant web application for managing student attendance at meditation centers.

## Features

- Multi-tenant system with separate data for each meditation center
- Student management (add, update, delete students)
- Attendance tracking with simple roll number entry
- Detailed reports (daily, weekly, monthly, per-student)
- Simple and minimal UI

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (file-based)
- **Frontend**: React, Bootstrap CSS
- **Authentication**: JWT (JSON Web Tokens)

## Installation

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd meditation-center-attendance
   ```

2. Run the setup script (installs dependencies and initializes the database):
   ```
   chmod +x setup.sh
   ./setup.sh
   ```

   Alternatively, follow these steps manually:

   a. Install server dependencies:
   ```
   npm install
   ```

   b. Install client dependencies:
   ```
   cd app/client
   npm install
   cd ../..
   ```

   c. Initialize the database:
   ```
   npm run init-db
   ```

3. Create a `.env` file in the root directory (copy from .env.example):
   ```
   PORT=3000
   NODE_ENV=development
   ```

## Running the Application

Start both the backend server and frontend development server:

```
npm run dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend development server on http://localhost:5173

## Usage

### Center Registration
- Register your meditation center with a unique Center ID
- Use the Center ID and password to login

### Student Management
- Add students with their details
- Each student receives a unique 3-digit roll number

### Attendance
- Students can mark attendance using the public link: `/attendance/[center_id]`
- Enter roll number on the keypad interface

### Reports
- View and export attendance reports by date, week, month, or student

## Deployment

1. Build the React frontend:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

## License

This project is open source and available under the [MIT License](LICENSE). 