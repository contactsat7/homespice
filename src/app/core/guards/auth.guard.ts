import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Both guards wait for AuthService.loading() to become false before
 * making a decision. Firebase resolves the signed-in user (and, for
 * admins, an extra Firestore lookup) asynchronously on page load, so
 * checking auth.user() / auth.isAdmin() synchronously here was racing
 * that resolution and incorrectly bouncing real admins back to "/"
 * whenever /admin was opened directly or refreshed.
 */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (auth.user()) return true;
      router.navigate(['/']);
      return false;
    })
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (auth.isAdmin()) return true;
      router.navigate(['/']);
      return false;
    })
  );
};
