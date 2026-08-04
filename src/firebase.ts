import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Parse the firebase configuration injected by AI Studio
const getFirebaseConfig = () => {
  try {
    // We fetch this via an API endpoint or we can hardcode it for now since we know it
    return {
      projectId: "gen-lang-client-0916890650",
      appId: "1:259690898917:web:3b69d1c6cb4b4159d13b0c",
      apiKey: "AIzaSyBxLqk6U0JUclKm6Q-x0hgw3WNspAXCRDI",
      authDomain: "gen-lang-client-0916890650.firebaseapp.com",
      storageBucket: "gen-lang-client-0916890650.firebasestorage.app",
      messagingSenderId: "259690898917",
    };
  } catch (e) {
    console.error("Failed to parse firebase config", e);
    return {};
  }
};

const app = initializeApp(getFirebaseConfig());
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Request scopes for Google Sheets and Drive
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;
    return { user, token };
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  await signOut(auth);
};
