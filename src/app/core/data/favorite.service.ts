import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  serverTimestamp,
  setDoc,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Favorite } from '../models/favorite.model';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly firestore = inject(Firestore);

  private favoritesRef(uid: string) {
    return collection(this.firestore, 'users', uid, 'favorites');
  }

  /** All of this user's favorited recipe ids. */
  listIds(uid: string): Observable<Set<string>> {
    return (
      collectionData(this.favoritesRef(uid), { idField: 'recipeId' }) as Observable<Favorite[]>
    ).pipe(map((favorites) => new Set(favorites.map((f) => f.recipeId))));
  }

  isFavorite(uid: string, recipeId: string): Observable<boolean> {
    return docData(doc(this.firestore, 'users', uid, 'favorites', recipeId)).pipe(
      map((snap) => !!snap),
    );
  }

  async setFavorite(uid: string, recipeId: string, isFavorite: boolean): Promise<void> {
    const ref = doc(this.firestore, 'users', uid, 'favorites', recipeId);
    if (isFavorite) {
      await setDoc(ref, { createdAt: serverTimestamp() });
    } else {
      await deleteDoc(ref);
    }
  }
}
