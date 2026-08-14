import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map(
      (user) =>
        !!user || router.createUrlTree(['/login'], { queryParams: { redirectUrl: state.url } }),
    ),
  );
};
