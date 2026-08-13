import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  increment,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Comment } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  list(recipeId: string): Observable<Comment[]> {
    const commentsRef = collection(this.firestore, 'recipes', recipeId, 'comments');
    return collectionData(query(commentsRef, orderBy('createdAt', 'desc')), {
      idField: 'id',
    }) as Observable<Comment[]>;
  }

  async add(recipeId: string, text: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Must be signed in to comment.');
    }
    const commentRef = doc(collection(this.firestore, 'recipes', recipeId, 'comments'));
    const recipeRef = doc(this.firestore, 'recipes', recipeId);

    const batch = writeBatch(this.firestore);
    batch.set(commentRef, {
      text: text.trim(),
      userId: user.uid,
      userName: user.displayName ?? 'Anonymous',
      userPhotoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
    });
    batch.update(recipeRef, { commentCount: increment(1) });
    await batch.commit();
  }

  async delete(recipeId: string, commentId: string): Promise<void> {
    const commentRef = doc(this.firestore, 'recipes', recipeId, 'comments', commentId);
    const recipeRef = doc(this.firestore, 'recipes', recipeId);

    const batch = writeBatch(this.firestore);
    batch.delete(commentRef);
    batch.update(recipeRef, { commentCount: increment(-1) });
    await batch.commit();
  }
}
