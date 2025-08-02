# Fix for Valorant API CORS Issues in Production

## Problem
The CORS proxies that work in development fail in production when hosted on Firebase due to:
- Proxy services blocking hosted domains
- Rate limiting on production traffic
- HTTPS/CORS policy restrictions

## Solution
Use Firebase Cloud Functions as a backend proxy to make API calls server-side, avoiding CORS entirely.

## Deployment Steps

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase Functions (if not already done)
```bash
# Run this in your valorant-finder-app directory
firebase init functions
# Select your existing project when prompted
# Choose JavaScript (not TypeScript)
# Don't overwrite existing files
```

### 4. Install Function Dependencies
```bash
cd functions
npm install
cd ..
```

### 5. Deploy the Cloud Function
```bash
# Deploy only the functions (faster than full deploy)
firebase deploy --only functions

# Or deploy everything (functions + hosting)
firebase deploy
```

### 6. Update Project ID (Important!)
In the file `src/utils/valorantApi.js`, update the Cloud Function URL to match your Firebase project ID:

```javascript
// Replace 'valorant-finder-app' with your actual Firebase project ID
const cloudFunctionUrl = isDevelopment 
  ? 'http://127.0.0.1:5001/YOUR-PROJECT-ID/us-central1/validateValorantProfile'
  : 'https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/validateValorantProfile';
```

### 7. Test the Function
After deployment, test the function:
```bash
# View function logs
firebase functions:log
```

## Expected Results

### ✅ Before Fix (Development)
- CORS proxies work locally
- API calls succeed in `npm start`

### ❌ Before Fix (Production)  
- All 4 CORS proxies fail
- "Failed to validate Valorant profile after trying 4 proxies"
- Users can't link their Valorant profiles

### ✅ After Fix (Production)
- Direct server-side API calls through Cloud Function
- No CORS issues
- Reliable profile validation
- Better error handling

## Cost Considerations
- Firebase Cloud Functions free tier: 2M invocations/month
- Each profile validation = 1 invocation
- Should be sufficient for most applications

## Troubleshooting

### Function Not Found Error
- Check that your project ID is correct in the URL
- Verify the function deployed successfully: `firebase functions:list`

### Permission Errors  
- Ensure Firebase billing is enabled (required for external API calls)
- Check Firebase console for any security rules

### API Key Issues
- Verify the HenrikDev API key is still valid
- Check API rate limits on the HenrikDev dashboard

## Alternative Solutions (if needed)

### Option 1: Environment Variables
Move the API key to environment variables:
```bash
firebase functions:config:set valorant.api_key="YOUR-API-KEY"
```

### Option 2: Firestore Rules
If you need to store API responses temporarily, update Firestore security rules.

### Option 3: Custom Domain
Use a custom domain for your Cloud Functions if needed for additional reliability.

## Verification
After deployment, the Valorant profile validation should work reliably in production without any CORS errors. 