import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  authState,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);

  readonly currentUser = toSignal(authState(this.auth), { initialValue: undefined });

  /** True for accounts listed in `environment.adminEmails`, who can edit/delete any recipe. */
  readonly isAdmin = computed(() => {
    const email = this.currentUser()?.email?.toLowerCase();
    return !!email && environment.adminEmails.some((e) => e.toLowerCase() === email);
  });

  async signInWithGoogle(): Promise<void> {
    const credential = await signInWithPopup(this.auth, new GoogleAuthProvider());
    await this.upsertUserDoc(credential.user);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
    await this.router.navigate(['/login']);
  }

  private async upsertUserDoc(user: User): Promise<void> {
    const userRef = doc(this.firestore, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        displayName: user.displayName ?? 'Anonymous',
        email: user.email ?? '',
        photoURL: user.photoURL ?? null,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}
