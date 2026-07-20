import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'os-tile',
  standalone: true,
  template: `<ng-content></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: var(--os-tile-min-h, 10rem);
      padding: var(--os-tile-pad, 1rem);
      background: #fff;
      box-sizing: border-box;
    }
  `],
})
export class Tile {}
