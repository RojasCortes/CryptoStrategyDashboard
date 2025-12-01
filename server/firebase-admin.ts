import admin from "firebase-admin";

let firebaseAdmin: admin.app.App | null = null;
let isInitialized = false;

export function initializeFirebaseAdmin(): admin.app.App | null {
  if (isInitialized) return firebaseAdmin;
  isInitialized = true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!projectId) {
    console.warn("Firebase Admin: No FIREBASE_PROJECT_ID configured, Firebase auth disabled");
    return null;
  }

  try {
    const config: admin.AppOptions = { projectId };
    
    if (clientEmail && privateKey) {
      config.credential = admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      });
      console.log("Firebase Admin initialized with service account credentials");
    } else {
      console.log("Firebase Admin initialized with project ID only (limited functionality)");
    }
    
    firebaseAdmin = admin.initializeApp(config);
    return firebaseAdmin;
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    return null;
  }
}

export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  if (!firebaseAdmin && !isInitialized) {
    initializeFirebaseAdmin();
  }
  
  if (!firebaseAdmin) {
    console.warn("Firebase Admin not available, cannot verify token");
    return null;
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return null;
  }
}

export function isFirebaseEnabled(): boolean {
  return firebaseAdmin !== null;
}

export function getFirebaseAdmin() {
  return firebaseAdmin;
}
