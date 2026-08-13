import { Timestamp } from '@angular/fire/firestore';

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: Timestamp;
}
