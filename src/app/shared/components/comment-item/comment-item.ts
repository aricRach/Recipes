import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Comment } from '../../../core/models/comment.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TimeAgoPipe],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentItemComponent {
  readonly comment = input.required<Comment>();
  readonly currentUserId = input<string | null>(null);
  readonly recipeOwnerId = input<string | null>(null);

  readonly deleteComment = output<string>();

  get canDelete(): boolean {
    return this.comment().userId === this.currentUserId();
  }

  get isRecipeOwner(): boolean {
    return this.comment().userId === this.recipeOwnerId();
  }
}
