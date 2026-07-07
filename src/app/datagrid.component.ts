import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, EventEmitter, signal, computed } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { ClrDatagridModule, SelectionType, ClrDatagridFilterInterface } from '@clr/angular/data/datagrid';
import { ClrModalModule } from '@clr/angular/modal';
import { CarbonIcon } from '@triangles/design-kit';

import Renew16 from '@carbon/icons/es/renew/16';
import Stop16 from '@carbon/icons/es/stop/16';
import Close16 from '@carbon/icons/es/close/16';

interface RegistryRow {
  id: string; name: string; kind: 'plugin' | 'host' | 'controller';
  capability: string; version: string; health: 'ok' | 'warn' | 'bad';
  replicas: number; updated: string; note: string; endpoint: string; namespace: string;
}

// OpenSphere 실제 도메인(subShell/plugin 레지스트리)을 데이터로 삼은 clr-datagrid 기능 시연 —
// 카탈로그 예시가 아니라 우리 맥락으로 채운 표. 정렬·필터(문자열/숫자/멀티셀렉트)·다중선택·
// 페이지네이션·로딩/빈 상태까지 clr-datagrid 실기능을 한 그리드에서 보인다. 행 상세는 인라인 확장이
// 아니라 이름 클릭 → 우측 슬라이드 패널(clr-side-panel), 행 액션은 "···" 드롭다운 메뉴로 처리한다.
const ROWS: RegistryRow[] = [
  { id: 'postgres', name: 'PostgreSQL', kind: 'plugin', capability: 'data.sql.postgres', version: 'v16.2', health: 'ok', replicas: 3, updated: '2026-06-20', note: 'CloudNativePG', endpoint: 'opensphere-pg-rw.opensphere-foundation.svc:5432', namespace: 'opensphere-foundation' },
  { id: 'opensearch', name: 'OpenSearch', kind: 'plugin', capability: 'data.search.opensearch', version: 'v2.14', health: 'warn', replicas: 2, updated: '2026-06-18', note: '샤드 재배치 중', endpoint: 'opensphere-search.opensphere-foundation.svc:9200', namespace: 'opensphere-foundation' },
  { id: 'rustfs', name: 'RustFS', kind: 'plugin', capability: 'data.object.s3', version: 'v0.9.1', health: 'ok', replicas: 3, updated: '2026-06-22', note: 'MinIO 대안', endpoint: 'opensphere-rustfs.opensphere-foundation.svc:9000', namespace: 'opensphere-foundation' },
  { id: 'keycloak', name: 'Keycloak', kind: 'plugin', capability: 'identity.iam.workspace', version: 'v25.0', health: 'ok', replicas: 2, updated: '2026-06-15', note: 'workspace SSO', endpoint: 'opensphere-keycloak.opensphere-foundation.svc:8080', namespace: 'opensphere-foundation' },
  { id: 'samba', name: 'Samba-AD', kind: 'plugin', capability: 'identity.directory.ad', version: 'v4.20', health: 'bad', replicas: 1, updated: '2026-06-10', note: 'LDAP 연결 실패', endpoint: 'opensphere-samba.opensphere-foundation.svc:389', namespace: 'opensphere-foundation' },
  { id: 'cluster-manager', name: 'Cluster Manager', kind: 'host', capability: 'ui.shell', version: 'v17', health: 'ok', replicas: 1, updated: '2026-07-01', note: 'K8s 리소스 콘솔', endpoint: 'cluster-manager.opensphere-system.svc:8080', namespace: 'opensphere-system' },
  { id: 'shell-template', name: 'Shell Template', kind: 'host', capability: 'ui.shell', version: 'v13', health: 'ok', replicas: 1, updated: '2026-07-03', note: '정본 골격', endpoint: 'shell-template.opensphere-system.svc:8080', namespace: 'opensphere-system' },
  { id: 'os-level', name: 'OS Level', kind: 'host', capability: 'ui.shell', version: 'v22', health: 'ok', replicas: 1, updated: '2026-06-30', note: 'Zabbix 흡수', endpoint: 'os.opensphere-system.svc:8080', namespace: 'opensphere-system' },
  { id: 'ai-hub', name: 'AI Hub', kind: 'host', capability: 'ui.shell', version: 'v9', health: 'warn', replicas: 1, updated: '2026-06-28', note: 'SoD 검토 대기', endpoint: 'ai.opensphere-system.svc:8080', namespace: 'opensphere-system' },
  { id: 'foundation', name: 'Foundation', kind: 'host', capability: 'ui.shell', version: 'v22', health: 'ok', replicas: 1, updated: '2026-07-03', note: 'capability 6도메인 로드맵', endpoint: 'foundation.opensphere-system.svc:8080', namespace: 'opensphere-system' },
  { id: 'dupa-registry', name: 'DUPA Registry Controller', kind: 'controller', capability: 'registry.oci', version: 'v4', health: 'ok', replicas: 1, updated: '2026-06-25', note: '서명 검증 체인', endpoint: 'dupa-registry-controller.opensphere-system.svc:8080', namespace: 'opensphere-system' },
  { id: 'fleet-api', name: 'Fleet API', kind: 'controller', capability: 'fleet.api', version: 'v3', health: 'ok', replicas: 2, updated: '2026-06-29', note: 'ManagedCluster', endpoint: 'opensphere-fleet-api.opensphere-system.svc:8080', namespace: 'opensphere-system' },
  { id: 'fleet-controller', name: 'Fleet Controller', kind: 'controller', capability: 'fleet.reconcile', version: 'v3', health: 'warn', replicas: 1, updated: '2026-06-29', note: '재시작 반복', endpoint: 'opensphere-fleet-controller.opensphere-system.svc:8080', namespace: 'opensphere-system' },
  { id: 'console-backend', name: 'Console Backend', kind: 'host', capability: 'console.bff', version: 'v8', health: 'ok', replicas: 1, updated: '2026-07-02', note: 'BFF', endpoint: 'console-backend.opensphere-system.svc:8080', namespace: 'opensphere-system' },
];

const HEALTH_VALUES: RegistryRow['health'][] = ['ok', 'warn', 'bad'];

type ColumnKey = 'name' | 'kind' | 'capability' | 'version' | 'health' | 'replicas' | 'updated' | 'note';
const COLUMN_DEFS: { key: ColumnKey; label: string }[] = [
  { key: 'name', label: '이름' },
  { key: 'kind', label: '종류' },
  { key: 'capability', label: 'Capability' },
  { key: 'version', label: '버전' },
  { key: 'health', label: '상태' },
  { key: 'replicas', label: '레플리카' },
  { key: 'updated', label: '갱신' },
  { key: 'note', label: '비고' },
];

// 상태(health) 멀티셀렉트 필터 — Clarity 18.2 datagrid엔 멀티셀렉트 필터 내장 컴포넌트가 없어
// ClrDatagridFilterInterface를 직접 구현(공식 확장 지점, export type으로 공개됨).
class HealthFilter implements ClrDatagridFilterInterface<RegistryRow> {
  readonly changes = new EventEmitter<boolean>();
  readonly selected = new Set<RegistryRow['health']>(HEALTH_VALUES);
  isActive(): boolean { return this.selected.size < HEALTH_VALUES.length; }
  accepts(row: RegistryRow): boolean { return this.selected.has(row.health); }
  toggle(h: RegistryRow['health'], checked: boolean): void {
    if (checked) this.selected.add(h); else this.selected.delete(h);
    this.changes.emit(true);
  }
}

// Clarity DataGrid 실기능 시연 — https://clarity.design/documentation/datagrid 참고.
// clr-dg-action-overflow(내부 <cds-icon>)와 clr-dg-column-toggle(exports에 없음, .d.ts 확인)은
// 미사용 — 대신 clr-dropdown(cds-icon 미사용, 확인됨)으로 "···" 액션 메뉴를, clr-side-panel로
// 이름 클릭 시 상세 뷰를 구현한다. 그리드는 내부 스크롤 없이 페이지 자연스크롤을 따른다.
@Component({
  selector: 'app-datagrid-page',
  standalone: true,
  imports: [CommonModule, ClarityModule, ClrDatagridModule, ClrModalModule, CarbonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dg-intro">
      <h1>DataGrid</h1>
      <p>
        Clarity <a href="https://clarity.design/documentation/datagrid" target="_blank" rel="noopener">DataGrid</a>의
        실제 기능을 이 프로젝트의 실제 도메인(subShell/plugin 레지스트리)으로 채워 시연한다 — 카탈로그가 아니라
        실사용 맥락. 정렬 · 문자열/숫자/멀티셀렉트 필터 · 다중 선택 · 페이지네이션을 전부 켜 뒀다. 이름을 클릭하면
        우측 슬라이드 패널로 상세를, 액션 열의 "···"로 행 작업 메뉴를 연다.
      </p>
      <p class="dg-note">
        <code>clr-dg-action-overflow</code>·<code>clr-side-panel</code>의 닫기 버튼은 내부에
        <code>&lt;cds-icon&gt;</code>을 쓴다 — 이 ShadowDom Angular-Element 구조에서 그게 부트스트랩 크래시를
        낸 전례가 있어(design-kit의 os-cicon이 우회한 것과 동일 문제) 액션은 <code>clr-dropdown</code>(아이콘 없는
        "···" 트리거)으로 대체했다. <code>clr-dg-column-toggle</code>은 설치 버전의 <code>ClrDatagridModule</code>
        exports에 아예 없어(선언만 되고 비공개, <code>.d.ts</code> 직접 확인) 대신 액션 열 헤더의 caret에서
        여는 커스텀 열 선택 메뉴(<code>*ngIf</code>로 열/셀을 함께 껐다 켬)로 구현했다.
      </p>
    </section>

    <section class="dg-controls">
      <button type="button" class="btn btn-sm" (click)="toggleLoading()">{{ loading() ? '로딩 끄기' : '로딩 데모(2초)' }}</button>
      <button type="button" class="btn btn-sm" (click)="showEmpty.set(!showEmpty())">{{ showEmpty() ? '데이터 복원' : '빈 상태 데모' }}</button>
    </section>

    <div class="dg-grid-wrap">
      <div class="dg-bulk-toolbar" *ngIf="selected().length as n">
        <span class="dg-bulk-count">{{ n }}개 선택됨</span>
        <span class="dg-bulk-divider"></span>
        <button type="button" class="dg-bulk-btn" (click)="bulkRestart()">
          <os-cicon [icon]="renewIcon" [size]="16" />
          <span>재시작</span>
        </button>
        <button type="button" class="dg-bulk-btn" (click)="bulkDisable()">
          <os-cicon [icon]="stopIcon" [size]="16" />
          <span>비활성화</span>
        </button>
        <button type="button" class="dg-bulk-btn dg-bulk-clear" (click)="clearSelection()">
          <os-cicon [icon]="closeIcon" [size]="16" />
          <span>선택 해제</span>
        </button>
      </div>
      <div class="dg-bulk-msg" *ngIf="!selected().length && bulkMessage() as msg">{{ msg }}</div>

      <clr-datagrid class="dg-noscroll" [clrDgLoading]="loading()" [clrDgSelected]="selected()" (clrDgSelectedChange)="selected.set($event)" [clrDgSelectionType]="selectionType">
      <clr-dg-column *ngIf="visibleCols().name" [clrDgField]="'name'">이름</clr-dg-column>
      <clr-dg-column *ngIf="visibleCols().kind" [clrDgField]="'kind'">종류</clr-dg-column>
      <clr-dg-column *ngIf="visibleCols().capability" [clrDgField]="'capability'">
        Capability
        <clr-dg-string-filter [clrDgStringFilter]="capabilityFilter"></clr-dg-string-filter>
      </clr-dg-column>
      <clr-dg-column *ngIf="visibleCols().version" [clrDgField]="'version'">버전</clr-dg-column>
      <clr-dg-column *ngIf="visibleCols().health" [clrDgField]="'health'">
        상태
        <clr-dg-filter [clrDgFilter]="healthFilter">
          <div class="dg-health-filter">
            <label *ngFor="let h of healthValues">
              <input type="checkbox" [checked]="healthFilter.selected.has(h)" (change)="healthFilter.toggle(h, $any($event.target).checked)" />
              <span class="label" [ngClass]="healthClass(h)">{{ h }}</span>
            </label>
          </div>
        </clr-dg-filter>
      </clr-dg-column>
      <clr-dg-column *ngIf="visibleCols().replicas" [clrDgField]="'replicas'" [clrDgColType]="'number'">
        레플리카
        <clr-dg-numeric-filter [clrDgNumericFilter]="replicasFilter"></clr-dg-numeric-filter>
      </clr-dg-column>
      <clr-dg-column *ngIf="visibleCols().updated" [clrDgField]="'updated'">갱신</clr-dg-column>
      <clr-dg-column *ngIf="visibleCols().note" [clrDgField]="'note'">비고</clr-dg-column>
      <clr-dg-column [style.width.px]="84">
        <span class="dg-action-head">
          액션
          <clr-dropdown>
            <button type="button" class="dg-colpick-trigger" clrDropdownTrigger aria-label="열 선택">⌄</button>
            <clr-dropdown-menu *clrIfOpen clrPosition="bottom-right" class="dg-colpick-menu">
              <div class="dg-colpick-title">열 선택</div>
              <label class="dg-colpick-item" *ngFor="let c of columnDefs">
                <input type="checkbox" [checked]="visibleCols()[c.key]" (change)="toggleColumn(c.key, $any($event.target).checked)" />
                <span>{{ c.label }}</span>
              </label>
            </clr-dropdown-menu>
          </clr-dropdown>
        </span>
      </clr-dg-column>

      <clr-dg-row *clrDgItems="let row of visibleRows(); trackBy: trackById" [clrDgItem]="row">
        <clr-dg-cell *ngIf="visibleCols().name"><a class="dg-name-link" (click)="openDetail(row)" (keydown.enter)="openDetail(row)" tabindex="0">{{ row.name }}</a></clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().kind">{{ row.kind }}</clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().capability" class="dg-mono">{{ row.capability }}</clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().version">{{ row.version }}</clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().health"><span class="label" [ngClass]="healthClass(row.health)">{{ row.health }}</span></clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().replicas">{{ row.replicas }}</clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().updated">{{ row.updated }}</clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().note">{{ row.note }}</clr-dg-cell>
        <clr-dg-cell>
          <clr-dropdown>
            <button type="button" class="btn btn-sm btn-link dg-kebab" clrDropdownTrigger aria-label="행 작업">···</button>
            <clr-dropdown-menu *clrIfOpen clrPosition="bottom-right">
              <button type="button" clrDropdownItem (click)="openDetail(row)">상세 보기</button>
              <button type="button" clrDropdownItem>재시작</button>
              <button type="button" clrDropdownItem>비활성화</button>
            </clr-dropdown-menu>
          </clr-dropdown>
        </clr-dg-cell>

        <clr-dg-row-detail *clrIfExpanded>
          <dl class="dg-detail">
            <dt>ID</dt><dd class="dg-mono">{{ row.id }}</dd>
            <dt>Namespace</dt><dd>{{ row.namespace }}</dd>
            <dt>제공 주소</dt><dd class="dg-mono">{{ row.endpoint }}</dd>
            <dt>비고</dt><dd>{{ row.note }}</dd>
          </dl>
        </clr-dg-row-detail>
      </clr-dg-row>

      <clr-dg-placeholder>일치하는 항목이 없습니다 — 필터를 조정해보라.</clr-dg-placeholder>

      <clr-dg-footer>
        <span class="dg-footer-count">{{ visibleRows().length }}개 항목</span>
        <clr-dg-pagination #pagination [clrDgPageSize]="5">
          <clr-dg-page-size [clrPageSizeOptions]="[5, 10, 20]">페이지당</clr-dg-page-size>
          {{ pagination.firstItem + 1 }} - {{ pagination.lastItem + 1 }} / {{ pagination.totalItems }}
        </clr-dg-pagination>
      </clr-dg-footer>
      </clr-datagrid>
    </div>

    <clr-side-panel *ngIf="panelOpen()" [clrSidePanelOpen]="panelOpen()" (clrSidePanelOpenChange)="panelOpen.set($event)" clrSidePanelSize="md">
      <h3 class="side-panel-title">{{ selectedRow()?.name }}</h3>
      <div class="side-panel-body">
        <dl class="dg-detail" *ngIf="selectedRow() as row">
          <dt>ID</dt><dd class="dg-mono">{{ row.id }}</dd>
          <dt>종류</dt><dd>{{ row.kind }}</dd>
          <dt>Capability</dt><dd class="dg-mono">{{ row.capability }}</dd>
          <dt>상태</dt><dd><span class="label" [ngClass]="healthClass(row.health)">{{ row.health }}</span></dd>
          <dt>Namespace</dt><dd>{{ row.namespace }}</dd>
          <dt>제공 주소</dt><dd class="dg-mono">{{ row.endpoint }}</dd>
          <dt>비고</dt><dd>{{ row.note }}</dd>
        </dl>
      </div>
    </clr-side-panel>
  `,
  styles: [`
    :host { display: block; }
    .dg-intro h1 { margin: 0 0 0.4rem; font-size: 1.7rem; font-weight: 300; color: #161616; }
    .dg-intro p { margin: 0 0 0.6rem; max-width: 58rem; color: #525252; font-size: 0.9rem; line-height: 1.55; }
    .dg-intro a { color: #4c6fff; }
    .dg-note { font-size: 0.8rem; color: #6f6f6f; background: #f4f4f4; border-left: 3px solid #8c8c8c; padding: 0.5rem 0.8rem; }
    .dg-note code { background: #eef0f3; padding: 0.05rem 0.3rem; border-radius: 3px; font-size: 0.9em; }

    .dg-controls { display: flex; align-items: center; gap: 0.6rem; margin: 1rem 0; }

    /* 체크박스로 행을 선택하면 그리드 헤더 자리에 겹쳐 나타나는 상단 일괄 작업 바 — vSphere/ESXi류
       관리 그리드의 관례(선택 시 헤더에 붙어 나타나는 컨텍스트 툴바)를 따름. absolute 오버레이라
       나타나거나 사라져도 그리드/페이지의 다른 요소가 전혀 밀리지 않는다(*ngIf로 껐다 켜도 레이아웃
       시프트 없음). top:13px는 .datagrid-inner-wrapper가 실제 헤더 위에 두는 여백 실측치 —
       .dg-grid-wrap(=clr-datagrid 바깥 경계)에서 진짜 .datagrid-header(33px)까지의 간격이라
       그만큼 내려서 헤더에 정확히 겹치게 한다(실측: wrapTop 440 vs headerTop 453). */
    .dg-grid-wrap { position: relative; }
    .dg-bulk-toolbar, .dg-bulk-msg {
      /* Clarity .datagrid-header가 position:sticky; z-index:501이라 그보다 위에 둬야 덮인다. */
      position: absolute; top: 13px; left: 0; right: 0; z-index: 600;
      height: 33px; box-sizing: border-box; padding: 0 0.9rem;
      animation: dgBarSlide 0.15s ease-out;
    }
    @keyframes dgBarSlide { from { transform: translateY(-100%); } to { transform: translateY(0); } }

    .dg-bulk-toolbar { display: flex; align-items: center; gap: 0.5rem; background: #eef2ff; border-bottom: 1px solid #c7d2fe; }
    .dg-bulk-count { font-size: 0.8rem; font-weight: 600; color: #303ab2; white-space: nowrap; }
    .dg-bulk-divider { width: 1px; height: 1.1rem; background: #c7d2fe; }
    .dg-bulk-btn { display: inline-flex; align-items: center; gap: 0.35rem; border: 1px solid transparent; background: transparent; color: #303ab2; font-size: 0.8rem; padding: 0.25rem 0.55rem; border-radius: 4px; cursor: pointer; }
    .dg-bulk-btn:hover { background: #dde3ff; }
    .dg-bulk-btn.dg-bulk-clear { color: #525252; margin-left: auto; }
    .dg-bulk-btn.dg-bulk-clear:hover { background: #e8e8e8; }
    .dg-bulk-msg { display: flex; align-items: center; font-size: 0.78rem; color: #0f8a65; font-style: italic; background: #e6f7f0; border-bottom: 1px solid #a7e8cf; }

    .dg-mono { font-family: var(--os-font-mono, 'Courier New', monospace); font-size: 0.78rem; }
    .dg-footer-count { margin: 0 0.75rem; font-size: 0.8rem; color: #6f6f6f; }

    .dg-name-link { color: #4c6fff; cursor: pointer; text-decoration: none; }
    .dg-name-link:hover { text-decoration: underline; }
    .dg-kebab { font-weight: 700; letter-spacing: 0.1em; padding: 0 0.5rem; }

    /* 액션 열 헤더의 열 선택(column picker) — clr-dg-column-toggle이 비공개라 커스텀 구현.
       트리거 히트영역을 패딩으로 넓히되, 가로 방향은 음수 마진을 안 써서 flex gap을 갉아먹지
       않게 한다(세로만 음수 마진 — 위아래 여백은 넓히고 "액션" 글자와의 가로 간격은 그대로 유지). */
    .dg-action-head { display: inline-flex; align-items: center; gap: 0.2rem; }
    /* clrDropdownTrigger가 붙이는 Clarity .dropdown-toggle이 padding:0으로 리셋해 !important로 눌러야 함 */
    .dg-colpick-trigger { border: none; background: transparent; color: inherit; font-size: 0.9rem; line-height: 1; cursor: pointer; padding: 0.3rem 0.35rem !important; margin: -0.3rem 0; border-radius: 3px; }
    .dg-colpick-trigger:hover { background: rgba(0, 0, 0, 0.06); color: #4c6fff; }
    .dg-colpick-menu.dg-colpick-menu { padding: 0.3rem 0; min-width: 9rem; }
    .dg-colpick-title { padding: 0.3rem 0.8rem; font-size: 0.72rem; font-weight: 600; color: #6f6f6f; text-transform: uppercase; letter-spacing: 0.03em; }
    .dg-colpick-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem 0.8rem; font-size: 0.82rem; font-weight: 400; cursor: pointer; }
    .dg-colpick-item:hover { background: #f4f4f4; }

    .dg-health-filter { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.6rem 0.8rem; }
    .dg-health-filter label { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.8rem; }

    .dg-detail { display: grid; grid-template-columns: 8rem 1fr; gap: 0.6rem 1rem; margin: 0; padding: 0.9rem 1.2rem; }
    .dg-detail dt { color: #6f6f6f; font-size: 0.78rem; }
    .dg-detail dd { margin: 0; font-size: 0.82rem; color: #161616; overflow-wrap: anywhere; }
    .side-panel-title { padding: 1rem 1.2rem 0.4rem; margin: 0; font-size: 1.1rem; font-weight: 600; color: #161616; }
    /* clr-side-panel이 열릴 때 cdkTrapFocus가 .modal-title-wrapper에 프로그램적으로 포커스를 준다 —
       브라우저 기본 포커스 아웃라인이 제목 둘레에 네모 박스로 보여서 제거(키보드 접근성 자체는 유지됨,
       시각적 표시만 없앰 — 실제 포커스 이동/트랩은 그대로 동작). */
    .modal-title-wrapper:focus, .modal-title-wrapper:focus-visible { outline: none; }

    /* 상태 배지가 셀 안에서 위로 붙어 보이는 문제 — inline-flex 배지의 기본 baseline 정렬 대신 middle로 */
    clr-dg-cell .label { vertical-align: middle; }

    /* 그리드 헤더/테이블 헤더 색 통일 — .ty-table th(Typography 페이지)와 동일 #e0e0e0.
       실제 배경은 .datagrid-header .datagrid-row가 var(--clr-thead-bgcolor)로 그린다(clr-ui.css 확인) —
       셀렉터를 !important로 누르는 대신 토큰 자체를 재정의(h1/h2/h3 폰트 토큰 때와 동일 패턴). */
    .dg-noscroll { --clr-thead-bgcolor: #e0e0e0; }
    /* .datagrid-column-title는 Clarity 컴포넌트 자신이 그리는 요소라 이 컴포넌트의 _ngcontent 속성이
       안 붙어 평범한 스코프 셀렉터로는 절대 안 먹는다(실측: 지금까지 rgb(33,51,59) 그대로였음,
       DataGrid2 작업 중 동일 버그 발견 후 역추적) — ::ng-deep으로 캡슐화를 뚫어야 함. */
    .dg-noscroll ::ng-deep .datagrid-column-title { color: #525252; }

    /* 그리드 기본 뷰 = 내부 스크롤 없음(페이지 자체 스크롤을 따름) */
    .dg-noscroll, .dg-noscroll .datagrid, .dg-noscroll .datagrid-outer-wrapper, .dg-noscroll .datagrid-host {
      height: auto !important; max-height: none !important;
    }
    .dg-noscroll .datagrid-rows, .dg-noscroll .datagrid-body {
      overflow: visible !important; max-height: none !important;
    }
  `],
})
export class DataGridPageComponent {
  readonly rows = signal<RegistryRow[]>(ROWS);
  readonly showEmpty = signal(false);
  readonly loading = signal(false);
  readonly selectionType = SelectionType.Multi;
  readonly selected = signal<RegistryRow[]>([]);
  readonly healthValues = HEALTH_VALUES;

  readonly renewIcon = Renew16;
  readonly stopIcon = Stop16;
  readonly closeIcon = Close16;
  readonly bulkMessage = signal<string | null>(null);

  readonly panelOpen = signal(false);
  readonly selectedRow = signal<RegistryRow | null>(null);

  readonly columnDefs = COLUMN_DEFS;
  readonly visibleCols = signal<Record<ColumnKey, boolean>>(
    Object.fromEntries(COLUMN_DEFS.map((c) => [c.key, true])) as Record<ColumnKey, boolean>
  );

  readonly visibleRows = computed(() => (this.showEmpty() ? [] : this.rows()));

  capabilityFilter = { accepts: (row: RegistryRow, search: string) => row.capability.toLowerCase().includes(search.toLowerCase()) };
  replicasFilter = { accepts: (row: RegistryRow, low: number, high: number) => row.replicas >= low && row.replicas <= high };
  healthFilter = new HealthFilter();

  trackById(_: number, row: RegistryRow): string { return row.id; }

  healthClass(h: RegistryRow['health']): string {
    return h === 'ok' ? 'label-success' : h === 'warn' ? 'label-warning' : 'label-danger';
  }

  openDetail(row: RegistryRow): void {
    this.selectedRow.set(row);
    this.panelOpen.set(true);
  }

  // 열을 *ngIf로 껐다 켜는 도중, 극히 드물게(재현 조건 미확정 — 반복 시도로도 안정 재현 안 됨)
  // Clarity 내부 코드(main.js, 문서 클릭 리스너)에서 "Cannot read properties of null (reading
  // 'contains')" 콘솔 에러가 관측된 적 있다. 렌더링/데이터 정합성엔 영향 없음(그리드는 항상 정상
  // 동작·열 정렬 유지) — Clarity 자체 오버레이 정리 로직 내부 예외로 보이며 이 컴포넌트 코드가
  // 아님. 향후 Clarity 버전 업 시 재확인.
  toggleColumn(key: ColumnKey, checked: boolean): void {
    const current = this.visibleCols();
    const visibleCount = Object.values(current).filter(Boolean).length;
    if (!checked && visibleCount <= 1 && current[key]) return;
    this.visibleCols.set({ ...current, [key]: checked });
  }

  toggleLoading(): void {
    if (this.loading()) { this.loading.set(false); return; }
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 2000);
  }

  bulkRestart(): void {
    const n = this.selected().length;
    this.flashBulkMessage(`${n}개 항목 재시작 요청됨`);
    this.clearSelection();
  }

  bulkDisable(): void {
    const n = this.selected().length;
    this.flashBulkMessage(`${n}개 항목 비활성화 요청됨`);
    this.clearSelection();
  }

  clearSelection(): void {
    this.selected.set([]);
  }

  private flashBulkMessage(msg: string): void {
    this.bulkMessage.set(msg);
    setTimeout(() => this.bulkMessage.set(null), 2500);
  }
}
