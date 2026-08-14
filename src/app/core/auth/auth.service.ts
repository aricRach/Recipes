import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  authState,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
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

  constructor() {
    void this.completeRedirectSignIn();
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const credential = await signInWithPopup(this.auth, new GoogleAuthProvider());
      await this.upsertUserDoc(credential.user);
    } catch (error) {
      if (!this.shouldFallBackToRedirect(error)) {
        throw error;
      }
      // Popup sign-in relies on the Firebase auth iframe reading/writing session storage;
      // browsers that partition or block that storage (in-app webviews, Safari ITP, Brave)
      // throw auth/missing-initial-state. Redirect avoids the cross-origin handshake.
      await signInWithRedirect(this.auth, new GoogleAuthProvider());
    }
  }

  private shouldFallBackToRedirect(error: unknown): boolean {
    const code = (error as { code?: string } | undefined)?.code;
    return code === 'auth/missing-initial-state' || code === 'auth/web-storage-unsupported';
  }

  private async completeRedirectSignIn(): Promise<void> {
    const credential = await getRedirectResult(this.auth);
    if (credential) {
      await this.upsertUserDoc(credential.user);
    }
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
