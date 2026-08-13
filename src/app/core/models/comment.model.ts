import { Timestamp } from '@angular/fire/firestore';

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  createdAt: Timestamp;
}
