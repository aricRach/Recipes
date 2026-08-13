import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  Timestamp,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Label } from '../models/label.model';

@Injectable({ providedIn: 'root' })
export class LabelService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly labelsRef = collection(this.firestore, 'labels');
  private readonly recipesRef = collection(this.firestore, 'recipes');

  list(): Observable<Label[]> {
    return collectionData(query(this.labelsRef, orderBy('name', 'asc')), {
      idField: 'id',
    }) as Observable<Label[]>;
  }

  /** Prefix search over the label name, used by the autocomplete. */
  async searchByPrefix(term: string): Promise<Label[]> {
    const nameLower = term.trim().toLowerCase();
    if (!nameLower) {
      return [];
    }
    const snap = await getDocs(
      query(
        this.labelsRef,
        orderBy('nameLower'),
        where('nameLower', '>=', nameLower),
        where('nameLower', '<=', nameLower + ''),
        limit(10),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Label);
  }

  /** Returns the existing label with this name, or creates a new one. */
  async findOrCreate(name: string): Promise<Label> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Must be signed in to create a label.');
    }
    const trimmed = name.trim();
    const nameLower = trimmed.toLowerCase();
    const existing = await getDocs(query(this.labelsRef, where('nameLower', '==', nameLower), limit(1)));
    if (!existing.empty) {
      const d = existing.docs[0];
      return { id: d.id, ...d.data() } as Label;
    }
    const ref = await addDoc(this.labelsRef, {
      name: trimmed,
      nameLower,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, name: trimmed, nameLower, createdBy: user.uid, createdAt: Timestamp.now() };
  }

  /** Deletes the label if no recipe references it anymore; a no-op otherwise. */
  async deleteIfUnused(labelId: string): Promise<void> {
    const stillReferenced = await getDocs(
      query(this.recipesRef, where('labelIds', 'array-contains', labelId), limit(1)),
    );
    if (stillReferenced.empty) {
      await deleteDoc(doc(this.firestore, 'labels', labelId));
    }
  }
}
