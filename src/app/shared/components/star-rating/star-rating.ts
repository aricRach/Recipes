import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRatingComponent {
  readonly value = input(0);
  readonly max = input(5);
  readonly readonly = input(false);

  readonly valueChange = output<number>();

  private readonly hoverValue = signal<number | null>(null);

  readonly stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));

  isFilled(star: number): boolean {
    const active = this.hoverValue() ?? this.value();
    return star <= active;
  }

  onHover(star: number): void {
    if (!this.readonly()) {
      this.hoverValue.set(star);
    }
  }

  onLeave(): void {
    this.hoverValue.set(null);
  }

  onClick(star: number): void {
    if (!this.readonly()) {
      this.valueChange.emit(star);
    }
  }
}
