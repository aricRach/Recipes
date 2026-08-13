import { Timestamp } from '@angular/fire/firestore';

export interface Favorite {
  recipeId: string;
  createdAt: Timestamp;
}
