import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CarbonIcon } from '@triangles/design-kit';

import Home16 from '@carbon/icons/es/home/16';
import Home24 from '@carbon/icons/es/home/24';
import Code16 from '@carbon/icons/es/code/16';
import Code32 from '@carbon/icons/es/code/32';
import Kubernetes16 from '@carbon/icons/es/kubernetes/16';
import Kubernetes32 from '@carbon/icons/es/kubernetes/32';
import ContainerRegistry16 from '@carbon/icons/es/container-registry/16';
import ContainerRegistry32 from '@carbon/icons/es/container-registry/32';
import Document16 from '@carbon/icons/es/document/16';
import Launch16 from '@carbon/icons/es/launch/16';
import Information20 from '@carbon/icons/es/information/20';
import Application16 from '@carbon/icons/es/application/16';
import ChartLine16 from '@carbon/icons/es/chart--line/16';
import ChartLine20 from '@carbon/icons/es/chart--line/20';
import Education16 from '@carbon/icons/es/education/16';
import Flow16 from '@carbon/icons/es/flow/16';
import Flow24 from '@carbon/icons/es/flow/24';
import Folder16 from '@carbon/icons/es/folder/16';
import MachineLearningModel16 from '@carbon/icons/es/machine-learning-model/16';
import MachineLearningModel20 from '@carbon/icons/es/machine-learning-model/20';
import Settings16 from '@carbon/icons/es/settings/16';
import Workspace16 from '@carbon/icons/es/workspace/16';
import BareMetalServer16 from '@carbon/icons/es/bare-metal-server/16';
import Categories16 from '@carbon/icons/es/categories/16';
import WarningAlt16 from '@carbon/icons/es/warning--alt/16';
import Apps16 from '@carbon/icons/es/apps/16';
import Apps24 from '@carbon/icons/es/apps/24';
import Db2Database16 from '@carbon/icons/es/db2--database/16';
import Db2Database20 from '@carbon/icons/es/db2--database/20';
import UserMultiple16 from '@carbon/icons/es/user--multiple/16';
import UserMultiple20 from '@carbon/icons/es/user--multiple/20';
import ObjectStorage16 from '@carbon/icons/es/object-storage/16';
import Password16 from '@carbon/icons/es/password/16';
import Search16 from '@carbon/icons/es/search/16';
import Chat20 from '@carbon/icons/es/chat/20';
import Renew20 from '@carbon/icons/es/renew/20';

interface IconEntry {
  name: string;      // Carbon 카탈로그 kebab-case 이름(@carbon/icons/es/<name>/<size>)
  icon: any;
  sizes: number[];   // 이 프로젝트가 실제로 import한 사이즈들
  shells: string[];  // 사용 중인 subShell
  usage: string;     // 실제 용도(내비 라벨/화면 위치)
}

// OpenSphere가 실제로 쓰는 Carbon 아이콘 목록 — https://carbondesignsystem.com/elements/icons/library/ 의
// '그리드 + 이름 라벨' 관례을 따르되, 카탈로그 전체가 아니라 **이 프로젝트 5개 subShell에서 실제 import된 것만** 수록.
// (grep으로 뽑은 실측치 — 2026-07-03. 새 아이콘을 추가하면 이 페이지도 같이 갱신할 것.)
const ICONS: IconEntry[] = [
  { name: 'home', icon: Home24, sizes: [16, 24], shells: ['template', 'ai', 'base', 'foundation'], usage: 'Overview(공통) · foundation capability-소비 카드(24)' },
  { name: 'code', icon: Code32, sizes: [16, 32], shells: ['template'], usage: 'Serverless 그룹(16) · 히어로 Jump-in 카드(32)' },
  { name: 'kubernetes', icon: Kubernetes32, sizes: [16, 32], shells: ['template'], usage: 'Cluster management 그룹(16) · 히어로 Jump-in 카드(32)' },
  { name: 'container-registry', icon: ContainerRegistry32, sizes: [16, 32], shells: ['template'], usage: 'Container Registry 내비(16) · 히어로 Jump-in 카드(32)' },
  { name: 'document', icon: Document16, sizes: [16], shells: ['template', 'ai'], usage: 'Docs(template) · Resources(ai)' },
  { name: 'launch', icon: Launch16, sizes: [16], shells: ['template'], usage: '"Open docs" 링크 아이콘' },
  { name: 'information', icon: Information20, sizes: [20], shells: ['template'], usage: '프로모 배너' },
  { name: 'application', icon: Application16, sizes: [16], shells: ['ai'], usage: 'Applications 그룹' },
  { name: 'chart--line', icon: ChartLine20, sizes: [16, 20], shells: ['ai', 'base', 'foundation'], usage: 'Experiments/Monitoring(ai) · Dashboard(base) · Observability 도메인(foundation,20)' },
  { name: 'education', icon: Education16, sizes: [16], shells: ['ai'], usage: 'Learning hub' },
  { name: 'flow', icon: Flow24, sizes: [16, 24], shells: ['ai', 'foundation'], usage: 'Data science pipelines(ai) · Services 내비/Jump 카드(foundation,24)' },
  { name: 'folder', icon: Folder16, sizes: [16], shells: ['ai'], usage: 'Data science projects' },
  { name: 'machine-learning-model', icon: MachineLearningModel20, sizes: [16, 20], shells: ['ai', 'foundation'], usage: 'Models(ai) · AI 도메인(foundation,20)' },
  { name: 'settings', icon: Settings16, sizes: [16], shells: ['ai'], usage: 'Administration' },
  { name: 'workspace', icon: Workspace16, sizes: [16], shells: ['ai'], usage: 'Workbenches' },
  { name: 'bare-metal-server', icon: BareMetalServer16, sizes: [16], shells: ['base'], usage: 'Hosts(os-level)' },
  { name: 'categories', icon: Categories16, sizes: [16], shells: ['base'], usage: 'Nodes(os-level)' },
  { name: 'warning--alt', icon: WarningAlt16, sizes: [16], shells: ['base'], usage: 'Problems(os-level)' },
  { name: 'apps', icon: Apps24, sizes: [16, 24], shells: ['foundation'], usage: 'Plugins 관리 내비(16) · Jump 카드(24)' },
  { name: 'db2--database', icon: Db2Database20, sizes: [16, 20], shells: ['foundation'], usage: 'Data 그룹/PostgreSQL(16) · Data 도메인(20)' },
  { name: 'user--multiple', icon: UserMultiple20, sizes: [16, 20], shells: ['foundation'], usage: 'Identity 그룹(16) · Identity 도메인(20)' },
  { name: 'object-storage', icon: ObjectStorage16, sizes: [16], shells: ['foundation'], usage: 'RustFS' },
  { name: 'password', icon: Password16, sizes: [16], shells: ['foundation'], usage: 'Keycloak' },
  { name: 'search', icon: Search16, sizes: [16], shells: ['foundation'], usage: 'OpenSearch' },
  { name: 'chat', icon: Chat20, sizes: [20], shells: ['foundation'], usage: 'Comm 도메인' },
  { name: 'renew', icon: Renew20, sizes: [20], shells: ['foundation'], usage: 'Backup 도메인' },
];

const SHELL_LABEL: Record<string, string> = {
  template: 'Shell Template', ai: 'AI Hub', base: 'OS Level', foundation: 'Foundation', clusterManager: 'Cluster Manager',
};

// Carbon Icons 안내 — https://carbondesignsystem.com/elements/icons/library/ 의 '그리드+이름' 관례을 따름.
// 카탈로그 전체가 아니라 **이 프로젝트가 실제로 쓰는 아이콘만** 진열(2026-07-03 grep 실측). 검색/셸 필터 지원.
@Component({
  selector: 'app-icons-page',
  standalone: true,
  imports: [CommonModule, CarbonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ic-intro">
      <h1>Icons</h1>
      <p>
        OpenSphere는 <a href="https://carbondesignsystem.com/elements/icons/library/" target="_blank" rel="noopener">Carbon Design System 아이콘 라이브러리</a>에서
        <code>&#64;carbon&#47;icons</code>(SVG 디스크립터, 프레임워크 무관)를 그대로 가져와 쓴다 — 아이콘은 폰트와 더불어 Clarity UI 위에 허용된
        두 가지 Carbon 리소스 중 하나다(구조·컴포넌트는 Clarity 단일).
        아래는 <strong>카탈로그 전체가 아니라 5개 subShell이 실제로 import해 쓰는 {{ icons().length }}종</strong>이다.
      </p>
      <div class="ic-filters">
        <input class="ic-search" type="search" placeholder="아이콘 이름/용도 검색…" [value]="q()" (input)="q.set($any($event.target).value)" />
        <div class="ic-shellfilter">
          <button type="button" class="ic-chip" [class.on]="shell() === null" (click)="shell.set(null)">전체</button>
          <button type="button" class="ic-chip" *ngFor="let s of shellKeys" [class.on]="shell() === s" (click)="shell.set(s)">{{ SHELL_LABEL[s] }}</button>
        </div>
      </div>
    </section>

    <section class="ic-grid">
      <div class="ic-tile" *ngFor="let e of filtered()">
        <div class="ic-glyph"><os-cicon [icon]="e.icon" [size]="24" /></div>
        <div class="ic-name">{{ e.name }}</div>
        <div class="ic-sizes"><span class="ic-size" *ngFor="let s of e.sizes">{{ s }}px</span></div>
        <div class="ic-usage">{{ e.usage }}</div>
        <div class="ic-shells"><span class="ic-shelltag" *ngFor="let s of e.shells">{{ SHELL_LABEL[s] || s }}</span></div>
      </div>
      <p class="ic-empty" *ngIf="!filtered().length">일치하는 아이콘 없음.</p>
    </section>

    <section class="ic-note">
      <h2>렌더 방식</h2>
      <p>
        <code>@carbon/icons-angular</code>(공식 Angular 디렉티브)는 Angular 11 peer 고정이라 이 프로젝트(Angular 22)에서 쓸 수 없다.
        대신 deep import(<code>&#64;carbon&#47;icons&#47;es&#47;&lt;name&gt;&#47;&lt;size&gt;</code>)로 SVG 디스크립터만 받아
        <code>&lt;os-cicon [icon] [size]&gt;</code> 컴포넌트가 직렬화한다(<code>carbon-icon.ts</code>).
        Clarity Core의 <code>cds-icon</code> 웹컴포넌트는 이 ShadowDom Angular-Element 셸에서 부트스트랩 크래시를 일으켜 미사용.
      </p>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .ic-intro h1 { margin: 0 0 0.4rem; font-size: 1.7rem; font-weight: 300; color: #161616; }
    .ic-intro p { margin: 0 0 1rem; max-width: 52rem; color: #525252; font-size: 0.9rem; line-height: 1.55; }
    .ic-intro a { color: #4c6fff; }
    .ic-intro code { background: #eef0f3; padding: 0.05rem 0.3rem; border-radius: 3px; font-size: 0.85em; }

    .ic-filters { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; margin-bottom: 1.2rem; }
    .ic-search { flex: 0 1 20rem; padding: 0.4rem 0.7rem; border: 1px solid #c6c6c6; border-radius: 4px; font-size: 0.84rem; }
    .ic-search:focus { outline: none; border-color: #4c6fff; }
    .ic-shellfilter { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .ic-chip { border: 1px solid #c6c6c6; background: #fff; color: #525252; border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.76rem; cursor: pointer; }
    .ic-chip:hover { border-color: #4c6fff; color: #161616; }
    .ic-chip.on { background: #4c6fff; border-color: #4c6fff; color: #fff; }

    .ic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr)); gap: 0.75rem; margin-bottom: 2rem; }
    .ic-tile { background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .ic-glyph { color: #161616; }
    .ic-name { font-family: var(--os-font-mono, 'Courier New', monospace); font-size: 0.78rem; font-weight: 600; color: #161616; }
    .ic-sizes { display: flex; gap: 0.3rem; }
    .ic-size { font-size: 0.65rem; color: #6f6f6f; background: #f4f4f4; border-radius: 3px; padding: 0.05rem 0.35rem; }
    .ic-usage { font-size: 0.74rem; color: #525252; line-height: 1.4; min-height: 2.2em; }
    .ic-shells { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: auto; padding-top: 0.35rem; border-top: 1px solid #f0f0f0; }
    .ic-shelltag { font-size: 0.62rem; color: #0f62fe; background: #edf5ff; border-radius: 3px; padding: 0.05rem 0.35rem; }
    .ic-empty { grid-column: 1 / -1; color: #8c8c8c; font-style: italic; padding: 2rem; text-align: center; }

    .ic-note { max-width: 52rem; padding: 1rem 1.1rem; background: #f4f4f4; border-left: 3px solid #0f62fe; border-radius: 2px; }
    .ic-note h2 { margin: 0 0 0.4rem; font-size: 0.95rem; font-weight: 600; color: #161616; }
    .ic-note p { margin: 0; font-size: 0.82rem; color: #525252; line-height: 1.55; }
    .ic-note code { background: #fff; padding: 0.05rem 0.3rem; border-radius: 3px; font-size: 0.85em; }
  `],
})
export class IconsPageComponent {
  readonly SHELL_LABEL = SHELL_LABEL;
  readonly shellKeys = Object.keys(SHELL_LABEL).filter((k) => ICONS.some((e) => e.shells.includes(k)));
  readonly q = signal('');
  readonly shell = signal<string | null>(null);
  readonly icons = signal(ICONS);

  readonly filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const shell = this.shell();
    return this.icons().filter((e) => {
      if (shell && !e.shells.includes(shell)) return false;
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || e.usage.toLowerCase().includes(q);
    });
  });
}
