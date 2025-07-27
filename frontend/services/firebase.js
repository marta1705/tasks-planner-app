// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // zostalo dodane
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth'; // zostalo dodane
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'; // zostalo dodane

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Firebase Project Settings -> General -> Your apps -> Config to get these values
const firebaseConfig = {
  apiKey: "AIzaSyA0bmBDRVWgZJ_Q3Zl3lq2qUM0OgUcnTJk",
  authDomain: "taskplanner-445bf.firebaseapp.com",
  projectId: "taskplanner-445bf",
  storageBucket: "taskplanner-445bf.firebasestorage.app",
  messagingSenderId: "736587129425",
  appId: "1:736587129425:web:b98da5ba32c0311f044e70",
  measurementId: "G-CESPGS5LG1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});



/**
 * Function to test Cloud Firestore by writing and then reading a simple document.
 */

async function testFirestore() {

  // Define the path to the document: collection "testCollection", document "testDocument"
  const testDocRef = doc(db, "testCollection", "testDocument");

  try {

    // 1. Write data to the document
    await setDoc(testDocRef, {
      message: "Hello from React Native! Firestore is alive!",
      timestamp: new Date().toISOString() // Using ISO string for easier readability
    });

    console.log("SUCCESS: Firestore write operation completed!");

    // 2. Read data back from the document
    const docSnap = await getDoc(testDocRef);

    if (docSnap.exists()) {
      console.log("SUCCESS: Firestore read operation completed!");
      console.log("Data read:", docSnap.data());
      // You can also see this data in your Firebase Console under Cloud Firestore -> Data
    } else {
      // doc.data() will be undefined in this case
      console.log("WARNING: No such document found after write. This shouldn't happen if write succeeded.");
    }
  } catch (error) {
    console.error("ERROR: Firestore operation failed!", error.message);
    console.error("Full error:", error);
  }

}
// Export the test function for use in other parts of the app
export { testFirestore };

