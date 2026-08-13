import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { FavoriteService } from '../../../core/data/favorite.service';
import { LabelService } from '../../../core/data/label.service';
import { RecipeService } from '../../../core/data/recipe.service';
import { RecipeCardComponent } from '../../../shared/components/recipe-card/recipe-card';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar';

@Component({
  selector: 'app-recipes-list-page',
  standalone: true,
  imports: [MatButtonModule, MatChipsModule, MatIconModule, RecipeCardComponent, SearchBarComponent],
  templateUrl: './recipes-list-page.html',
  styleUrl: './recipes-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipesListPageComponent {
  private readonly recipeService = inject(RecipeService);
  private readonly labelService = inject(LabelService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  readonly ownerOnly = !!inject(ActivatedRoute).snapshot.data['ownerOnly'];
  readonly favoritesOnly = !!inject(ActivatedRoute).snapshot.data['favoritesOnly'];

  readonly searchText = signal('');
  readonly selectedLabelIds = signal<Set<string>>(new Set());

  readonly labels = toSignal(this.labelService.list(), { initialValue: [] });

  private readonly recipes = toSignal(this.recipeService.list(), { initialValue: [] });

  private readonly uid = computed(() => this.auth.currentUser()?.uid);

  readonly favoriteIds = toSignal(
    toObservable(this.uid).pipe(
      switchMap((uid) =>
        uid
          ? this.favoriteService.listIds(uid).pipe(
              catchError((error) => {
                console.error('Failed to load favorites', error);
                return of(new Set<string>());
              }),
            )
          : of(new Set<string>()),
      ),
    ),
    { initialValue: new Set<string>() },
  );

  readonly filteredRecipes = computed(() => {
    const term = this.searchText().trim().toLowerCase();
    const labelIds = this.selectedLabelIds();
    const ownerId = this.uid();
    const favoriteIds = this.favoriteIds();
    return this.recipes().filter((recipe) => {
      if (this.ownerOnly && recipe.ownerId !== ownerId) {
        return false;
      }
      if (this.favoritesOnly && !favoriteIds.has(recipe.id)) {
        return false;
      }
      if (labelIds.size > 0 && !recipe.labelIds.some((id) => labelIds.has(id))) {
        return false;
      }
      if (!term) {
        return true;
      }
      return (
        recipe.titleLower.includes(term) ||
        recipe.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(term))
      );
    });
  });

  onSearch(value: string): void {
    this.searchText.set(value);
  }

  toggleLabel(labelId: string): void {
    const next = new Set(this.selectedLabelIds());
    if (next.has(labelId)) {
      next.delete(labelId);
    } else {
      next.add(labelId);
    }
    this.selectedLabelIds.set(next);
  }

  openRecipe(id: string): void {
    void this.router.navigate(['/recipes', id]);
  }

  toggleFavorite(recipeId: string): void {
    const uid = this.uid();
    if (!uid) {
      return;
    }
    void this.favoriteService.setFavorite(uid, recipeId, !this.favoriteIds().has(recipeId));
  }

  createRecipe(): void {
    void this.router.navigate(['/recipes/new']);
  }
}
