import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, signal, computed, OnDestroy } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CarbonIcon } from '@triangles/design-kit';
import { OverviewComponent } from './overview.component';
import { IconsPageComponent } from './icons.component';
import { TypographyPageComponent } from './typography.component';
import { DataGridPageComponent } from './datagrid.component';
import { DataGrid2PageComponent } from './datagrid2.component';
import { SHELL_ID, shellHostContext } from './host-context';
import Home16 from '@carbon/icons/es/home/16';
import Code16 from '@carbon/icons/es/code/16';
import Kubernetes16 from '@carbon/icons/es/kubernetes/16';
import ContainerRegistry16 from '@carbon/icons/es/container-registry/16';
import Document16 from '@carbon/icons/es/document/16';
import ColorPalette16 from '@carbon/icons/es/color-palette/16';

interface Leaf { id: string; label: string }
interface Group { id: string; label: string; icon: any; children: Leaf[] }

// SDK 표준 subShell — Shell Template(컨테이너 섹션 데모). ShadowDom 자체완결.
// 2단 = OpenSphere AI Hub 표준(Clarity clr-vertical-nav, 흰 배경, 왼쪽 blue bar). 섹션 진입 = overview(규약).
//
// ─── URL 상태 표준(모든 subShell 공통) ───
// Main Shell은 `/p/<id>`와 browser history를 소유하고, subShell은 그 아래 서브패스 의미만 소유한다.
// 설치 상태에서는 ctx.routing의 basePath/navigate/subscribe만 사용한다. 직접 history를 다루는 코드는
// Host 없이 실행하는 standalone 개발 fallback에 한정한다. deep-link·새로고침·뒤로/앞으로는 모두
// 같은 tabFromRoute() 경로를 통과하므로 동일 view를 복원한다.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ClarityModule, CarbonIcon, OverviewComponent, IconsPageComponent, TypographyPageComponent, DataGridPageComponent, DataGrid2PageComponent],
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
        <a clrVerticalNavLink href="/manual">
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
        <app-icons-page *ngIf="active() === 'ds-icons'" />
        <app-typography-page *ngIf="active() === 'ds-typography'" />
        <app-datagrid-page *ngIf="active() === 'ds-datagrid'" />
        <app-datagrid2-page *ngIf="active() === 'ds-datagrid2'" />
        <div class="dp" *ngIf="isDummyPage()">
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
export class AppComponent implements OnDestroy {
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
    { id: 'design-system', label: 'Design System', icon: ColorPalette16, children: [
      { id: 'ds-icons', label: 'Icons' },
      { id: 'ds-typography', label: 'Typography' },
      { id: 'ds-datagrid', label: 'DataGrid' },
      { id: 'ds-datagrid2', label: 'DataGrid 2' },
    ] },
  ];

  private readonly host = shellHostContext();
  private readonly routing = this.host?.routing;
  private readonly basePath = this.routing?.basePath ?? `/p/${SHELL_ID}`;
  readonly active = signal<string>(this.tabFromRoute(this.routing?.currentPath()));
  private readonly open = signal<Record<string, boolean>>({ serverless: true, clusters: true, 'design-system': true });
  private readonly onPopState = () => this.select(this.tabFromRoute(), false);
  private readonly unsubscribeRoute?: () => void;
  isOpen(id: string): boolean { return !!this.open()[id]; }
  setOpen(id: string, v: boolean): void { this.open.update((m) => ({ ...m, [id]: v })); }

  constructor() {
    if (this.routing) {
      this.unsubscribeRoute = this.routing.subscribe((path) => this.select(this.tabFromRoute(path), false));
    } else {
      window.addEventListener('popstate', this.onPopState);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeRoute?.();
    if (!this.routing) window.removeEventListener('popstate', this.onPopState);
  }

  /** updateUrl=false는 popstate(이미 URL이 바뀐 뒤)에 대한 반응일 때만 쓴다 — pushState 중복 방지. */
  select(id: string, updateUrl = true): void {
    this.active.set(id);
    if (updateUrl) this.syncUrl(id);
  }

  /** 실제 콘텐츠 컴포넌트가 있는 탭(overview·ds-icons·ds-typography)은 더미 폴백에서 제외. */
  isDummyPage(): boolean {
    return !['overview', 'ds-icons', 'ds-typography', 'ds-datagrid', 'ds-datagrid2'].includes(this.active());
  }

  /** 유효 탭 id 전체(overview·registry·모든 그룹 자식) — 임의 경로 주입 방지용. */
  private validTabIds(): Set<string> {
    const ids = new Set<string>(['overview', 'registry']);
    for (const g of this.groups) for (const c of g.children) ids.add(c.id);
    return ids;
  }

  /** Host basePath 뒤 첫 세그먼트 → 탭 id. 모르는/빈 값은 overview로 폴백. */
  private tabFromRoute(rawPath?: string): string {
    const current = new URL(
      rawPath ?? `${window.location.pathname}${window.location.search}${window.location.hash}`,
      window.location.origin,
    );
    const base = new URL(this.basePath, window.location.origin).pathname.replace(/\/+$/, '');
    const suffix = current.pathname === base
      ? ''
      : current.pathname.startsWith(`${base}/`) ? current.pathname.slice(base.length + 1) : '';
    const t = suffix.split('/')[0] ?? '';
    return this.validTabIds().has(t) ? t : 'overview';
  }

  /** 설치 상태에서는 Host routing seam, standalone 개발에서만 history fallback을 사용한다. */
  private syncUrl(id: string): void {
    const nextPath = id === 'overview' ? this.basePath : `${this.basePath}/${id}`;
    const current = new URL(
      this.routing?.currentPath() ?? `${window.location.pathname}${window.location.search}${window.location.hash}`,
      window.location.origin,
    );
    const nextUrl = `${nextPath}${current.search}${current.hash}`;
    if (`${current.pathname}${current.search}${current.hash}` === nextUrl) return;
    if (this.routing) {
      this.routing.navigate(nextUrl);
    } else {
      history.pushState(null, '', nextUrl);
    }
  }

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
