import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }
    
    // Parse the service account string into an object.
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error: ", error.message);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
