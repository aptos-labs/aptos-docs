import { getAuth, type Auth } from "@firebase/auth";
import { getFirebaseApp } from "./app";

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
