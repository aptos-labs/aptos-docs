export class FirebaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(`[Firebase]: ${message}`, options);
    this.name = "FirebaseError";
  }
}
