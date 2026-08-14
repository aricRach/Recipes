import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CloudinaryService } from '../../../core/data/cloudinary.service';
import { LabelService } from '../../../core/data/label.service';
import { RecipeService } from '../../../core/data/recipe.service';
import { CanComponentDeactivate } from '../../../core/guards/unsaved-changes.guard';
import { Label } from '../../../core/models/label.model';
import { NewRecipeInput } from '../../../core/models/recipe.model';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload';
import { LabelAutocompleteComponent } from '../../../shared/components/label-autocomplete/label-autocomplete';

@Component({
  selector: 'app-recipe-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ImageUploadComponent,
    LabelAutocompleteComponent,
  ],
  templateUrl: './recipe-form-page.html',
  styleUrl: './recipe-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeFormPageComponent implements CanComponentDeactivate {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly labelService = inject(LabelService);
  private readonly cloudinaryService = inject(CloudinaryService);

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = !!this.editingId;

  readonly allLabels = toSignal(this.labelService.list(), { initialValue: [] });
  readonly selectedLabels = signal<Label[]>([]);

  readonly pendingImageFile = signal<File | null>(null);
  readonly existingImageUrl = signal<string | null>(null);
  private existingImagePath: string | null = null;
  private imageRemoved = false;
  private originalLabelIds: string[] = [];

  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    instructions: ['', Validators.required],
    ingredients: this.fb.array([this.newIngredientGroup()]),
  });

  get ingredientsArray() {
    return this.form.controls.ingredients;
  }

  constructor() {
    if (this.editingId) {
      void this.loadExistingRecipe(this.editingId);
    }
  }

  private newIngredientGroup() {
    return this.fb.nonNullable.group({
      name: ['', Validators.required],
      quantity: [''],
    });
  }

  addIngredient(): void {
    this.ingredientsArray.push(this.newIngredientGroup());
  }

  removeIngredient(index: number): void {
    if (this.ingredientsArray.length > 1) {
      this.ingredientsArray.removeAt(index);
    }
  }

  onImageSelected(file: File): void {
    this.pendingImageFile.set(file);
    this.imageRemoved = false;
    this.form.markAsDirty();
  }

  onImageCleared(): void {
    this.pendingImageFile.set(null);
    this.existingImageUrl.set(null);
    this.imageRemoved = true;
    this.form.markAsDirty();
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saving();
  }

  async onCreateLabel(name: string): Promise<void> {
    const label = await this.labelService.findOrCreate(name);
    if (!this.selectedLabels().some((l) => l.id === label.id)) {
      this.selectedLabels.set([...this.selectedLabels(), label]);
    }
  }

  onSelectedLabelsChange(labels: Label[]): void {
    this.selectedLabels.set(labels);
  }

  cancel(): void {
    void this.router.navigate(this.editingId ? ['/recipes', this.editingId] : ['/']);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const raw = this.form.getRawValue();
      const ingredients = raw.ingredients
        .map((i) => ({ name: i.name.trim(), quantity: i.quantity.trim() }))
        .filter((i) => i.name);

      const id = this.editingId ?? this.recipeService.createId();

      let imageUrl = this.imageRemoved ? null : this.existingImageUrl();
      let imagePath = this.imageRemoved ? null : this.existingImagePath;

      const file = this.pendingImageFile();
      if (file) {
        const uploaded = await this.cloudinaryService.uploadRecipeImage(id, file);
        imageUrl = uploaded.url;
        imagePath = uploaded.path;
      }

      const input: NewRecipeInput = {
        title: raw.title.trim(),
        instructions: raw.instructions.trim(),
        ingredients,
        imageUrl,
        imagePath,
        labelIds: this.selectedLabels().map((l) => l.id),
        labelNames: this.selectedLabels().map((l) => l.name),
      };

      if (this.editingId) {
        await this.recipeService.update(this.editingId, input);
        const removedLabelIds = this.originalLabelIds.filter((id) => !input.labelIds.includes(id));
        await Promise.all(removedLabelIds.map((id) => this.labelService.deleteIfUnused(id)));
        this.form.markAsPristine();
        void this.router.navigate(['/recipes', this.editingId]);
      } else {
        await this.recipeService.create(id, input);
        this.form.markAsPristine();
        void this.router.navigate(['/recipes', id]);
      }
    } finally {
      this.saving.set(false);
    }
  }

  private async loadExistingRecipe(id: string): Promise<void> {
    const recipe = await firstValueFrom(this.recipeService.getById(id));
    if (!recipe) {
      return;
    }
    this.form.patchValue({ title: recipe.title, instructions: recipe.instructions });

    this.ingredientsArray.clear();
    for (const ingredient of recipe.ingredients) {
      this.ingredientsArray.push(
        this.fb.nonNullable.group({
          name: [ingredient.name, Validators.required],
          quantity: [ingredient.quantity],
        }),
      );
    }
    if (this.ingredientsArray.length === 0) {
      this.ingredientsArray.push(this.newIngredientGroup());
    }

    this.existingImageUrl.set(recipe.imageUrl);
    this.existingImagePath = recipe.imagePath;
    this.originalLabelIds = recipe.labelIds;

    this.selectedLabels.set(
      recipe.labelIds.map(
        (labelId, i) =>
          ({
            id: labelId,
            name: recipe.labelNames[i] ?? '',
            nameLower: (recipe.labelNames[i] ?? '').toLowerCase(),
            createdBy: recipe.ownerId,
            createdAt: recipe.createdAt,
          }) satisfies Label,
      ),
    );
  }
}
