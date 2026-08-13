import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { Ingredient } from '../../../core/models/recipe.model';

@Component({
  selector: 'app-ingredient-checklist',
  standalone: true,
  imports: [],
  templateUrl: './ingredient-checklist.html',
  styleUrl: './ingredient-checklist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientChecklistComponent {
  readonly ingredients = input.required<Ingredient[]>();

  readonly checkedIndexes = signal<Set<number>>(new Set());

  constructor() {
    // Reset the (session-only) checked state whenever we're shown a different recipe's ingredients.
    effect(() => {
      this.ingredients();
      this.checkedIndexes.set(new Set());
    });
  }

  toggle(index: number): void {
    const next = new Set(this.checkedIndexes());
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    this.checkedIndexes.set(next);
  }

  isChecked(index: number): boolean {
    return this.checkedIndexes().has(index);
  }
}
