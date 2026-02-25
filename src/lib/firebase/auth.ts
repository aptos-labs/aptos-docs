import { type Auth, getAuth } from "firebase/auth";
import { getFirebaseApp } from "./app";

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
