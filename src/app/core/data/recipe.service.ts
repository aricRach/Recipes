import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { NewRecipeInput, Recipe } from '../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly recipesRef = collection(this.firestore, 'recipes');

  /** Generates a Firestore doc id up front, so an image can be uploaded to a path
   * that references the recipe before the recipe document itself is written. */
  createId(): string {
    return doc(this.recipesRef).id;
  }

  /** Loads all recipes, newest first; label and text filtering happen client-side. */
  list(): Observable<Recipe[]> {
    return collectionData(query(this.recipesRef, orderBy('createdAt', 'desc')), {
      idField: 'id',
    }) as Observable<Recipe[]>;
  }

  getById(id: string): Observable<Recipe | undefined> {
    return docData(doc(this.firestore, 'recipes', id), { idField: 'id' }) as Observable<
      Recipe | undefined
    >;
  }

  /** `id` should come from {@link createId} — called up front so an image can be
   * uploaded to Cloudinary under a folder that references the recipe before this doc is written. */
  async create(id: string, input: NewRecipeInput): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Must be signed in to create a recipe.');
    }
    const recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      ...input,
      titleLower: input.title.trim().toLowerCase(),
      ownerId: user.uid,
      ownerName: user.displayName ?? 'Anonymous',
      ownerPhotoURL: user.photoURL ?? null,
      avgRating: 0,
      ratingCount: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(this.firestore, 'recipes', id), recipe);
  }

  async update(id: string, input: NewRecipeInput): Promise<void> {
    await updateDoc(doc(this.firestore, 'recipes', id), {
      ...input,
      titleLower: input.title.trim().toLowerCase(),
      updatedAt: serverTimestamp(),
    });
  }

  /** Firestore doesn't cascade-delete subcollections, so comments and ratings
   * are deleted explicitly before the recipe doc itself. */
  async delete(id: string): Promise<void> {
    const commentsRef = collection(this.firestore, 'recipes', id, 'comments');
    const ratingsRef = collection(this.firestore, 'recipes', id, 'ratings');
    const [commentDocs, ratingDocs] = await Promise.all([
      getDocs(commentsRef),
      getDocs(ratingsRef),
    ]);

    const batch = writeBatch(this.firestore);
    for (const d of commentDocs.docs) {
      batch.delete(d.ref);
    }
    for (const d of ratingDocs.docs) {
      batch.delete(d.ref);
    }
    batch.delete(doc(this.firestore, 'recipes', id));
    await batch.commit();
  }
}
