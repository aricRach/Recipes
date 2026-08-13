import { Timestamp } from '@angular/fire/firestore';

export interface Rating {
  uid: string;
  value: number;
  updatedAt: Timestamp;
}
