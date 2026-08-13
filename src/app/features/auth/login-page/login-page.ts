import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
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

  readonly signingIn = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.currentUser()) {
        void this.router.navigateByUrl('/');
      }
    });
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
