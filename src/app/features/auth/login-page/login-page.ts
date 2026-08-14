import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly signingIn = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.currentUser()) {
        void this.router.navigateByUrl(this.redirectUrl());
      }
    });
  }

  /**
   * Reads the deep-link target from the `redirectUrl` query param (set by `authGuard`) instead
   * of session/local storage, so the destination survives Firebase's full-page signInWithRedirect
   * round trip. Only same-app relative paths are honored to prevent open-redirect abuse.
   */
  private redirectUrl(): string {
    const target = this.route.snapshot.queryParamMap.get('redirectUrl');
    return target && /^\/(?!\/|\\)/.test(target) ? target : '/';
  }

  async signIn(): Promise<void> {
    this.signingIn.set(true);
    try {
      await this.auth.signInWithGoogle();
    } finally {
      this.signingIn.set(false);
    }
  }
}
