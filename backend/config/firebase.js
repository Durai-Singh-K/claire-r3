import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp;

try {
  // Try to load service account from file
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin initialized with service account file');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Use environment variables
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });

    console.log('Firebase Admin initialized with environment variables');
  } else {
    console.warn('Firebase Admin not configured - Google OAuth will not work');
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

export { admin, firebaseApp };
