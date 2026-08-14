import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/recipes/recipes-list-page/recipes-list-page').then(
        (m) => m.RecipesListPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'recipes/new',
    loadComponent: () =>
      import('./features/recipes/recipe-form-page/recipe-form-page').then(
        (m) => m.RecipeFormPageComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'recipes/mine',
    loadComponent: () =>
      import('./features/recipes/recipes-list-page/recipes-list-page').then(
        (m) => m.RecipesListPageComponent,
      ),
    canActivate: [authGuard],
    data: { ownerOnly: true },
  },
  {
    path: 'recipes/favorites',
    loadComponent: () =>
      import('./features/recipes/recipes-list-page/recipes-list-page').then(
        (m) => m.RecipesListPageComponent,
      ),
    canActivate: [authGuard],
    data: { favoritesOnly: true },
  },
  {
    path: 'recipes/:id/edit',
    loadComponent: () =>
      import('./features/recipes/recipe-form-page/recipe-form-page').then(
        (m) => m.RecipeFormPageComponent,
      ),
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'recipes/:id',
    loadComponent: () =>
      import('./features/recipes/recipe-detail-page/recipe-detail-page').then(
        (m) => m.RecipeDetailPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
