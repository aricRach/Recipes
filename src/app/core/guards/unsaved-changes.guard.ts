import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanDeactivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

export interface CanComponentDeactivate {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  const dialog = inject(MatDialog);
  const dialogRef = dialog.open(ConfirmDialogComponent, {
    data: {
      title: 'Discard changes?',
      message: 'You have unsaved changes. Leave this page and discard them?',
      confirmLabel: 'Discard',
      cancelLabel: 'Stay',
    },
  });

  return firstValueFrom(dialogRef.afterClosed()).then((confirmed) => !!confirmed);
};
