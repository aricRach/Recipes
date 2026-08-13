import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Label } from '../../../core/models/label.model';

interface CreateLabelOption {
  readonly create: true;
  readonly term: string;
}

function isCreateOption(value: Label | CreateLabelOption): value is CreateLabelOption {
  return typeof value === 'object' && value !== null && 'create' in value;
}

@Component({
  selector: 'app-label-autocomplete',
  standalone: true,
  imports: [FormsModule, MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatIconModule],
  templateUrl: './label-autocomplete.html',
  styleUrl: './label-autocomplete.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelAutocompleteComponent {
  readonly allLabels = input<Label[]>([]);
  readonly selected = input<Label[]>([]);

  readonly selectedChange = output<Label[]>();
  readonly createLabel = output<string>();

  private readonly labelInput = viewChild.required<ElementRef<HTMLInputElement>>('labelInput');

  readonly inputText = signal('');

  readonly filteredOptions = computed(() => {
    const term = this.inputText().trim().toLowerCase();
    const selectedIds = new Set(this.selected().map((l) => l.id));
    const candidates = this.allLabels().filter((l) => !selectedIds.has(l.id));
    const matches = term ? candidates.filter((l) => l.nameLower.includes(term)) : candidates;
    return matches.slice(0, 20);
  });

  readonly showCreateOption = computed(() => {
    const term = this.inputText().trim().toLowerCase();
    if (!term) {
      return false;
    }
    return !this.allLabels().some((l) => l.nameLower === term);
  });

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value as Label | CreateLabelOption;
    if (isCreateOption(value)) {
      this.createLabel.emit(value.term);
    } else {
      this.addLabel(value);
    }
    this.inputText.set('');
    // Material writes the selected option's value straight into the native input
    // before `optionSelected` fires, bypassing the ngModel binding above — clear it directly.
    this.labelInput().nativeElement.value = '';
  }

  remove(label: Label): void {
    this.selectedChange.emit(this.selected().filter((l) => l.id !== label.id));
  }

  private addLabel(label: Label): void {
    if (!this.selected().some((l) => l.id === label.id)) {
      this.selectedChange.emit([...this.selected(), label]);
    }
  }
}
