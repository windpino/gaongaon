import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 아버님의 구글 서버 정보
const firebaseConfig = {
  apiKey: "AIzaSyA4qA9AvYKL_19kz3WJWyE7JPaqhoPEA7E",
  authDomain: "aurora-ea981.firebaseapp.com",
  projectId: "aurora-ea981",
  storageBucket: "aurora-ea981.firebasestorage.app",
  messagingSenderId: "1096118604572",
  appId: "1:1096118604572:web:59cccf35783d69fcb020d9",
  measurementId: "G-9PHKPGCLFC"
};

const app = initializeApp(firebaseConfig);
// 여기서 db를 만들어서 윈도우(시스템) 전역에 살짝 보관합니다. (꼬임 방지)
(window as any).db = getFirestore(app);

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}