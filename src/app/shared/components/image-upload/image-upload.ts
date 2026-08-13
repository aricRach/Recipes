import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadComponent {
  readonly existingImageUrl = input<string | null>(null);

  readonly fileSelected = output<File>();
  readonly cleared = output<void>();

  private readonly localPreviewUrl = signal<string | null>(null);

  readonly previewUrl = computed(() => this.localPreviewUrl() ?? this.existingImageUrl());
  readonly error = signal<string | null>(null);

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.error.set('Image is too large. Max size is 10 MB.');
      return;
    }
    this.error.set(null);
    this.localPreviewUrl.set(URL.createObjectURL(file));
    this.fileSelected.emit(file);
  }

  clear(): void {
    this.error.set(null);
    this.localPreviewUrl.set(null);
    this.cleared.emit();
  }
}
