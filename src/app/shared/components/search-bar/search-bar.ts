import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  readonly placeholder = input('Search recipes...');

  readonly valueChange = output<string>();

  readonly text = signal('');
  private readonly input$ = new Subject<string>();

  constructor() {
    this.input$
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((value) => this.valueChange.emit(value));
  }

  onInput(value: string): void {
    this.text.set(value);
    this.input$.next(value);
  }
}
