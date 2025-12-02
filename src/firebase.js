import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 追加: 画像保存用

const firebaseConfig = {
  apiKey: "AIzaSyATlcWdG5W-PVCxd8AiyoQ-i4gWDkEBuTA",
  authDomain: "gjc-app-850e9.firebaseapp.com",
  projectId: "gjc-app-850e9",
  storageBucket: "gjc-app-850e9.firebasestorage.app",
  messagingSenderId: "908526875334",
  appId: "1:908526875334:web:de9540780e3f60378d1dc7"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// データベース(Firestore)とストレージ(Storage)をエクスポート
export const db = getFirestore(app);
export const storage = getStorage(app); // 追加