import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyAt_LXqyTKB9Xn_YUVrVyE-l1piktuaf_I',
  authDomain: 'classattendancemanager-c937d.firebaseapp.com',
  projectId: 'classattendancemanager-c937d',
  storageBucket: 'classattendancemanager-c937d.firebasestorage.app',
  messagingSenderId: '385618318246',
  appId: '1:385618318246:web:be239179475734cc783567',
  measurementId: 'G-1GXSYJ4W1E',
  databaseURL: 'https://classattendancemanager-c937d-default-rtdb.asia-southeast1.firebasedatabase.app',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
