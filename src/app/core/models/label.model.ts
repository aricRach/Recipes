import { Timestamp } from '@angular/fire/firestore';

export interface Label {
  id: string;
  name: string;
  nameLower: string;
  createdBy: string;
  createdAt: Timestamp;
}
