import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface IconNode { elem: string; attrs?: Record<string, unknown>; content?: IconNode[]; }

@Component({
  selector: 'os-cicon',
  standalone: true,
  template: `<span class="os-cicon" [innerHTML]="html"></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host{display:inline-flex} .os-cicon{display:inline-flex;line-height:0} .os-cicon ::ng-deep svg{fill:currentColor}`],
})
export class CarbonIcon {
  private san = inject(DomSanitizer);
  html: SafeHtml = '';
  private descriptor?: IconNode;
  private iconSize = 16;

  @Input({ required: true }) set icon(value: IconNode) { this.descriptor = value; this.render(); }
  @Input() set size(value: number) { this.iconSize = value; this.render(); }

  private render(): void {
    if (!this.descriptor) return;
    const root: IconNode = {
      ...this.descriptor,
      attrs: { ...this.descriptor.attrs, width: this.iconSize, height: this.iconSize },
    };
    this.html = this.san.bypassSecurityTrustHtml(this.serialize(root));
  }

  private serialize(node: IconNode): string {
    const attributes = Object.entries(node.attrs || {})
      .map(([key, value]) => `${key}="${String(value)}"`)
      .join(' ');
    const inner = (node.content || []).map((child) => this.serialize(child)).join('');
    return `<${node.elem} ${attributes}>${inner}</${node.elem}>`;
  }
}
