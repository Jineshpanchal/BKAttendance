# Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Meditation Center Attendance"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users (optional for development)

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
5. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - Your production domain
6. Copy the Client ID

## Step 4: Configure Environment Variables

Create a `.env` file in your project root with:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
PORT=3000
```

## Step 5: Update App.jsx

Replace `YOUR_GOOGLE_CLIENT_ID_HERE` in `app/client/src/App.jsx` with your actual Google Client ID:

```javascript
const GOOGLE_CLIENT_ID = "your_actual_google_client_id";
```

## Step 6: Domain Restriction

The app is configured to only allow `@bkivv.org` email addresses. To change this:

1. Edit `app/server/routes/auth.js`
2. Find the line: `if (!email.endsWith('@bkivv.org'))`
3. Replace `@bkivv.org` with your desired domain

## Step 7: Test the Integration

1. Start your development server: `npm run dev`
2. Go to `http://localhost:5173`
3. Click "Sign in with Google"
4. Use an email with the allowed domain
5. Complete the registration process

## Features Implemented

✅ **Email Domain Restriction**: Only `@bkivv.org` emails can register
✅ **Google OAuth Integration**: Secure authentication with Google
✅ **Automatic Registration**: New users are guided through registration
✅ **Existing User Login**: Returning users are automatically logged in
✅ **Database Integration**: Email addresses are stored and validated
✅ **JWT Token Generation**: Secure session management
✅ **Fallback Authentication**: Traditional login still available

## Security Features

- Email domain validation on both frontend and backend
- Google token verification on the server
- JWT token generation for session management
- Unique email constraint in database
- HTTPS requirement for production (Google OAuth requirement)

## Production Deployment

1. Update authorized origins and redirect URIs in Google Cloud Console
2. Set production environment variables
3. Ensure HTTPS is enabled (required for Google OAuth)
4. Test the complete flow in production environment

## Troubleshooting

**Error: "Only @bkivv.org email addresses are allowed"**
- Make sure you're using an email with the correct domain
- Check the domain restriction in the backend code

**Error: "Invalid Google token"**
- Verify your Google Client ID is correct
- Check that the OAuth consent screen is properly configured
- Ensure your domain is added to authorized origins

**Error: "Registration failed"**
- Check that the database has been initialized with the email column
- Verify the backend server is running
- Check server logs for detailed error messages 