import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, docData, runTransaction, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Rating } from '../models/rating.model';
import { Recipe } from '../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  getUserRating(recipeId: string): Observable<Rating | undefined> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Must be signed in to read a rating.');
    }
    return docData(doc(this.firestore, 'recipes', recipeId, 'ratings', user.uid)) as Observable<
      Rating | undefined
    >;
  }

  async setRating(recipeId: string, value: number): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Must be signed in to rate a recipe.');
    }
    const recipeRef = doc(this.firestore, 'recipes', recipeId);
    const ratingRef = doc(this.firestore, 'recipes', recipeId, 'ratings', user.uid);

    await runTransaction(this.firestore, async (tx) => {
      const [recipeSnap, ratingSnap] = await Promise.all([tx.get(recipeRef), tx.get(ratingRef)]);
      const recipe = recipeSnap.data() as Recipe | undefined;
      const avgRating = recipe?.avgRating ?? 0;
      const ratingCount = recipe?.ratingCount ?? 0;
      const previousValue = ratingSnap.exists() ? (ratingSnap.data() as Rating).value : null;

      const currentSum = avgRating * ratingCount;
      const newCount = previousValue === null ? ratingCount + 1 : ratingCount;
      const newSum = previousValue === null ? currentSum + value : currentSum - previousValue + value;
      const newAvg = newCount > 0 ? newSum / newCount : 0;

      tx.set(ratingRef, { uid: user.uid, value, updatedAt: serverTimestamp() });
      tx.update(recipeRef, { avgRating: newAvg, ratingCount: newCount });
    });
  }
}
