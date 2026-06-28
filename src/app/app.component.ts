import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, signal, computed } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CarbonIcon } from './carbon-icon';
import { OverviewComponent } from './overview.component';
import Home16 from '@carbon/icons/es/home/16';
import Code16 from '@carbon/icons/es/code/16';
import Kubernetes16 from '@carbon/icons/es/kubernetes/16';
import ContainerRegistry16 from '@carbon/icons/es/container-registry/16';
import Document16 from '@carbon/icons/es/document/16';

interface Leaf { id: string; label: string }
interface Group { id: string; label: string; icon: any; children: Leaf[] }

// SDK 표준 subShell — Shell Template(컨테이너 섹션 데모). ShadowDom 자체완결.
// 2단 = OpenSphere AI Hub 표준(Clarity clr-vertical-nav, 흰 배경, 왼쪽 blue bar). 섹션 진입 = overview(규약).
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ClarityModule, CarbonIcon, OverviewComponent],
  encapsulation: ViewEncapsulation.ShadowDom,
  styleUrls: ['./app.component.css'],
  styles: [`
    .os-shell { display: grid; grid-template-columns: 12rem minmax(0, 1fr); min-height: 100%; }

    /* 2단 표준(.cm-nav) — AI Hub 방식. ShadowDom이라 셸 전역 .cm-nav가 안 닿으므로 라이트 팔레트를 셸 내부에 명시. */
    .cm-nav { min-height: 100vh; background: #fff; --clr-vertical-nav-bg-color: #ffffff; }
    .cm-nav .clr-vertical-nav, .cm-nav .nav-content { background: #fff; }
    .cm-nav .nav-group, .cm-nav .nav-group-content, .cm-nav .nav-group-children { background: transparent; }
    .cm-nav a[clrVerticalNavLink], .cm-nav .nav-link, .cm-nav .nav-trigger { color: #525252; font-size: 0.8rem; }
    .cm-nav a[clrVerticalNavLink] os-cicon, .cm-nav .nav-trigger os-cicon { color: #525252; }
    .cm-nav a[clrVerticalNavLink]:hover, .cm-nav .nav-link:hover, .cm-nav .nav-trigger:hover { color: #161616; background: rgba(0,0,0,0.04); }
    .cm-nav a[clrVerticalNavLink]::before, .cm-nav .nav-link::before { display: none !important; content: none !important; }
    .cm-nav a[clrVerticalNavLink].active, .cm-nav .nav-link.active {
      color: #161616; font-weight: 600; background: rgba(76,111,255,0.10); box-shadow: inset 3px 0 0 #4c6fff;
    }
    .cm-brand { display: flex; align-items: center; gap: 0.4rem; min-height: 3.05rem; padding: 0.55rem 0.9rem; border-bottom: 1px solid #e0e0e0; }
    .cm-brand strong { font-size: 0.875rem; font-weight: 600; color: #161616; }

    .os-content { min-width: 0; min-height: 100vh; overflow: auto; padding: 1.1rem 1.4rem 2rem; background: var(--os-overview-bg, #f4f4f4); }
    .os-tree-ic { width: 16px; height: 16px; }

    /* 페이지 경로 — AI Hub 표준: 상단 회색 박스 바(좌우 풀폭). negative margin = .os-content 패딩(1.1rem 1.4rem). */
    .cc-crumbs {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; min-height: 2rem;
      margin: -1.1rem -1.4rem 0.9rem; padding: 0.45rem 1.4rem;
      background: #f4f4f4; border-top: 1px solid #d0d0d0; border-bottom: 1px solid #d0d0d0;
      font-size: 0.8125rem; line-height: 1rem;
    }
    .cc-crumb { color: #525252; }
    .cc-crumb-link { color: #4c6fff; text-decoration: none; cursor: pointer; }
    .cc-crumb-link:hover { text-decoration: underline; }
    .cc-crumb.is-cur { color: #525252; } .cc-crumb-sep { color: #8c8c8c; }

    /* dummy 페이지(리소스 목록 자리) */
    .dp h1 { margin: 0 0 0.25rem; font-size: 1.5rem; font-weight: 400; color: #161616; }
    .dp .dp-sub { color: #525252; font-size: 0.85rem; margin: 0 0 1rem; }
    .dp-table { width: 100%; background: #fff; border: 1px solid #e0e0e0; border-collapse: collapse; }
    .dp-table th { background: #e0e0e0; color: #161616; font-size: 0.75rem; text-align: left; padding: 0.7rem 1rem; }
    .dp-empty { padding: 2rem 1rem; text-align: center; color: #8c8c8c; font-style: italic; border-top: 1px solid #e0e0e0; }
  `],
  template: `
    <div class="os-shell">
      <clr-vertical-nav class="cm-nav" [clrVerticalNavCollapsible]="false" aria-label="Shell Template 보조 내비">
        <div class="cm-brand"><strong>Shell Template</strong></div>

        <a clrVerticalNavLink [class.active]="active() === 'overview'" (click)="select('overview')" (keydown.enter)="select('overview')">
          <os-cicon clrVerticalNavIcon class="os-tree-ic" [icon]="iHome" [size]="16" />Overview
        </a>

        <clr-vertical-nav-group *ngFor="let g of groups"
            [clrVerticalNavGroupExpanded]="isOpen(g.id)" (clrVerticalNavGroupExpandedChange)="setOpen(g.id, $event)">
          <os-cicon clrVerticalNavIcon class="os-tree-ic" [icon]="g.icon" [size]="16" />{{ g.label }}
          <clr-vertical-nav-group-children>
            <a *ngFor="let c of g.children" clrVerticalNavLink
               [class.active]="active() === c.id" (click)="select(c.id)" (keydown.enter)="select(c.id)">{{ c.label }}</a>
          </clr-vertical-nav-group-children>
        </clr-vertical-nav-group>

        <a clrVerticalNavLink [class.active]="active() === 'registry'" (click)="select('registry')" (keydown.enter)="select('registry')">
          <os-cicon clrVerticalNavIcon class="os-tree-ic" [icon]="iRegistry" [size]="16" />Container Registry
        </a>
        <a clrVerticalNavLink href="#docs" (click)="$event.preventDefault()">
          <os-cicon clrVerticalNavIcon class="os-tree-ic" [icon]="iDoc" [size]="16" />Docs
        </a>
      </clr-vertical-nav>

      <section class="os-content">
        <nav class="cc-crumbs" aria-label="페이지 경로">
          <ng-container *ngFor="let c of crumbs(); let last = last">
            <a *ngIf="c.link === 'home'" class="cc-crumb cc-crumb-link" href="/">{{ c.label }}</a>
            <a *ngIf="c.link && c.link !== 'home'" class="cc-crumb cc-crumb-link" (click)="crumbNav(c)">{{ c.label }}</a>
            <span *ngIf="!c.link" class="cc-crumb is-cur">{{ c.label }}</span>
            <span class="cc-crumb-sep" *ngIf="!last">/</span>
          </ng-container>
        </nav>

        <app-overview *ngIf="active() === 'overview'" />
        <div class="dp" *ngIf="active() !== 'overview'">
          <h1>{{ activeLabel() }}</h1>
          <p class="dp-sub">{{ activeLabel() }} — 더미 페이지(2단 내비·active 검증용 / 템플릿 예시).</p>
          <table class="dp-table">
            <thead><tr><th>이름</th><th>상태</th><th>생성</th></tr></thead>
            <tbody><tr><td colspan="3" class="dp-empty">항목 없음 — 더미 페이지</td></tr></tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class AppComponent {
  readonly iHome = Home16; readonly iRegistry = ContainerRegistry16; readonly iDoc = Document16;
  readonly groups: Group[] = [
    { id: 'serverless', label: 'Serverless', icon: Code16, children: [
      { id: 'sl-get-started', label: 'Get started' },
      { id: 'sl-projects', label: 'Serverless projects' },
      { id: 'sl-cli', label: 'CLI' },
    ] },
    { id: 'clusters', label: 'Cluster management', icon: Kubernetes16, children: [
      { id: 'cm-get-started', label: 'Get started' },
      { id: 'cm-clusters', label: 'Clusters' },
      { id: 'cm-reservations', label: 'Reservations' },
      { id: 'cm-helm', label: 'Helm catalog' },
    ] },
  ];

  readonly active = signal<string>('overview');
  private readonly open = signal<Record<string, boolean>>({ serverless: true, clusters: true });
  isOpen(id: string): boolean { return !!this.open()[id]; }
  setOpen(id: string, v: boolean): void { this.open.update((m) => ({ ...m, [id]: v })); }
  select(id: string): void { this.active.set(id); }

  private label(id: string): string {
    if (id === 'overview') return 'Overview';
    if (id === 'registry') return 'Container Registry';
    for (const g of this.groups) { const c = g.children.find((x) => x.id === id); if (c) return c.label; }
    return id;
  }
  private groupOf(id: string): Group | null {
    for (const g of this.groups) if (g.children.some((c) => c.id === id)) return g;
    return null;
  }
  activeLabel(): string { return this.label(this.active()); }
  /** 페이지 경로 — 비-현재는 링크(home=콘솔/, overview=셸 루트, group=그룹 첫 항목). */
  readonly crumbs = computed<{ label: string; link: 'home' | 'overview' | 'group' | null; groupId?: string }[]>(() => {
    const id = this.active();
    const out: { label: string; link: 'home' | 'overview' | 'group' | null; groupId?: string }[] = [{ label: 'OpenSphere', link: 'home' }];
    if (id === 'overview') { out.push({ label: 'Shell Template', link: null }); return out; }
    out.push({ label: 'Shell Template', link: 'overview' });
    const g = this.groupOf(id);
    if (g) out.push({ label: g.label, link: 'group', groupId: g.id });
    out.push({ label: this.label(id), link: null });
    return out;
  });
  crumbNav(c: { link: 'home' | 'overview' | 'group' | null; groupId?: string }): void {
    if (c.link === 'overview') { this.select('overview'); return; }
    if (c.link === 'group' && c.groupId) {
      const g = this.groups.find((x) => x.id === c.groupId);
      if (g?.children[0]) { this.setOpen(g.id, true); this.select(g.children[0].id); }
    }
  }
}
