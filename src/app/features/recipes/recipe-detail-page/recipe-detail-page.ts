import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CommentService } from '../../../core/data/comment.service';
import { FavoriteService } from '../../../core/data/favorite.service';
import { LabelService } from '../../../core/data/label.service';
import { RatingService } from '../../../core/data/rating.service';
import { RecipeService } from '../../../core/data/recipe.service';
import { CommentFormComponent } from '../../../shared/components/comment-form/comment-form';
import { CommentItemComponent } from '../../../shared/components/comment-item/comment-item';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { IngredientChecklistComponent } from '../../../shared/components/ingredient-checklist/ingredient-checklist';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating';

@Component({
  selector: 'app-recipe-detail-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    CommentFormComponent,
    CommentItemComponent,
    IngredientChecklistComponent,
    StarRatingComponent,
  ],
  templateUrl: './recipe-detail-page.html',
  styleUrl: './recipe-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly labelService = inject(LabelService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly ratingService = inject(RatingService);
  private readonly commentService = inject(CommentService);
  private readonly dialog = inject(MatDialog);
  protected readonly auth = inject(AuthService);

  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly recipeId = computed(() => this.routeParamMap().get('id') ?? '');

  readonly recipe = toSignal(
    toObservable(this.recipeId).pipe(
      switchMap((id) => (id ? this.recipeService.getById(id) : of(undefined))),
    ),
    { initialValue: undefined },
  );

  readonly comments = toSignal(
    toObservable(this.recipeId).pipe(switchMap((id) => (id ? this.commentService.list(id) : of([])))),
    { initialValue: [] },
  );

  private readonly ratingParams = computed(() => ({
    id: this.recipeId(),
    uid: this.auth.currentUser()?.uid ?? null,
  }));

  readonly myRating = toSignal(
    toObservable(this.ratingParams).pipe(
      switchMap(({ id, uid }) => (id && uid ? this.ratingService.getUserRating(id) : of(undefined))),
    ),
    { initialValue: undefined },
  );

  readonly isOwner = computed(() => {
    const uid = this.auth.currentUser()?.uid;
    return !!uid && uid === this.recipe()?.ownerId;
  });

  /** Owners and the configured admin account can edit/delete a recipe. */
  readonly canManage = computed(() => this.isOwner() || this.auth.isAdmin());

  private readonly uid = computed(() => this.auth.currentUser()?.uid);

  private readonly favoriteParams = computed(() => ({
    id: this.recipeId(),
    uid: this.uid() ?? null,
  }));

  readonly isFavorite = toSignal(
    toObservable(this.favoriteParams).pipe(
      switchMap(({ id, uid }) =>
        id && uid
          ? this.favoriteService.isFavorite(uid, id).pipe(
              catchError((error) => {
                console.error('Failed to load favorite status', error);
                return of(false);
              }),
            )
          : of(false),
      ),
    ),
    { initialValue: false },
  );

  toggleFavorite(): void {
    const uid = this.uid();
    const id = this.recipeId();
    if (!uid || !id) {
      return;
    }
    void this.favoriteService.setFavorite(uid, id, !this.isFavorite());
  }

  editRecipe(): void {
    void this.router.navigate(['/recipes', this.recipeId(), 'edit']);
  }

  async deleteRecipe(): Promise<void> {
    const recipe = this.recipe();
    if (!recipe) {
      return;
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete recipe',
        message: `Delete "${recipe.title}"? This cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });
    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) {
      return;
    }
    await this.recipeService.delete(recipe.id);
    await Promise.all(recipe.labelIds.map((labelId) => this.labelService.deleteIfUnused(labelId)));
    void this.router.navigateByUrl('/');
  }

  rate(value: number): void {
    void this.ratingService.setRating(this.recipeId(), value);
  }

  addComment(text: string): void {
    void this.commentService.add(this.recipeId(), text);
  }

  deleteComment(commentId: string): void {
    void this.commentService.delete(this.recipeId(), commentId);
  }
}
