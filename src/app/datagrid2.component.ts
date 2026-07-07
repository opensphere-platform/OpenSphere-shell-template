import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { ClrDatagridModule, SelectionType } from '@clr/angular/data/datagrid';
import { CarbonIcon, type IconNode } from '@triangles/design-kit';

import Add16 from '@carbon/icons/es/add/16';
import View16 from '@carbon/icons/es/view/16';
import Play16 from '@carbon/icons/es/play/16';
import Stop16 from '@carbon/icons/es/stop/16';
import Pause16 from '@carbon/icons/es/pause/16';
import Renew16 from '@carbon/icons/es/renew/16';
import OverflowMenuHorizontal16 from '@carbon/icons/es/overflow-menu--horizontal/16';
import Search16 from '@carbon/icons/es/search/16';
import Plug16 from '@carbon/icons/es/plug/16';
import BareMetalServer16 from '@carbon/icons/es/bare-metal-server/16';
import Gears16 from '@carbon/icons/es/gears/16';

interface Row2 {
  id: string; name: string; kind: string; capability: string; version: string;
  health: 'ok' | 'warn' | 'bad'; replicas: number; updated: string; note: string;
  namespace: string; endpoint: string;
}

const ROWS: Row2[] = [
  { id: 'postgres', name: 'PostgreSQL', kind: 'plugin', capability: 'data.sql.postgres', version: 'v16.2', health: 'ok', replicas: 3, updated: '2026-06-20', note: 'CloudNativePG', namespace: 'opensphere-foundation', endpoint: 'opensphere-pg-rw.opensphere-foundation.svc:5432' },
  { id: 'opensearch', name: 'OpenSearch', kind: 'plugin', capability: 'data.search.opensearch', version: 'v2.14', health: 'warn', replicas: 2, updated: '2026-06-18', note: '샤드 재배치 중', namespace: 'opensphere-foundation', endpoint: 'opensphere-search.opensphere-foundation.svc:9200' },
  { id: 'rustfs', name: 'RustFS', kind: 'plugin', capability: 'data.object.s3', version: 'v0.9.1', health: 'ok', replicas: 3, updated: '2026-06-22', note: 'MinIO 대안', namespace: 'opensphere-foundation', endpoint: 'opensphere-rustfs.opensphere-foundation.svc:9000' },
  { id: 'keycloak', name: 'Keycloak', kind: 'plugin', capability: 'identity.iam.workspace', version: 'v25.0', health: 'ok', replicas: 2, updated: '2026-06-15', note: 'workspace SSO', namespace: 'opensphere-foundation', endpoint: 'opensphere-keycloak.opensphere-foundation.svc:8080' },
  { id: 'samba', name: 'Samba-AD', kind: 'plugin', capability: 'identity.directory.ad', version: 'v4.20', health: 'bad', replicas: 1, updated: '2026-06-10', note: 'LDAP 연결 실패', namespace: 'opensphere-foundation', endpoint: 'opensphere-samba.opensphere-foundation.svc:389' },
  { id: 'cluster-manager', name: 'Cluster Manager', kind: 'host', capability: 'ui.shell', version: 'v17', health: 'ok', replicas: 1, updated: '2026-07-01', note: 'K8s 리소스 콘솔', namespace: 'opensphere-system', endpoint: 'cluster-manager.opensphere-system.svc:8080' },
  { id: 'shell-template', name: 'Shell Template', kind: 'host', capability: 'ui.shell', version: 'v24', health: 'ok', replicas: 1, updated: '2026-07-03', note: '정본 골격', namespace: 'opensphere-system', endpoint: 'shell-template.opensphere-system.svc:8080' },
  { id: 'os-level', name: 'OS Level', kind: 'host', capability: 'ui.shell', version: 'v22', health: 'ok', replicas: 1, updated: '2026-06-30', note: 'Zabbix 흡수', namespace: 'opensphere-system', endpoint: 'os.opensphere-system.svc:8080' },
  { id: 'ai-hub', name: 'AI Hub', kind: 'host', capability: 'ui.shell', version: 'v9', health: 'warn', replicas: 1, updated: '2026-06-28', note: 'SoD 검토 대기', namespace: 'opensphere-system', endpoint: 'ai.opensphere-system.svc:8080' },
  { id: 'foundation', name: 'Foundation', kind: 'host', capability: 'ui.shell', version: 'v22', health: 'ok', replicas: 1, updated: '2026-07-03', note: 'capability 6도메인 로드맵', namespace: 'opensphere-system', endpoint: 'foundation.opensphere-system.svc:8080' },
  { id: 'dupa-registry', name: 'DUPA Registry Controller', kind: 'controller', capability: 'registry.oci', version: 'v4', health: 'ok', replicas: 1, updated: '2026-06-25', note: '서명 검증 체인', namespace: 'opensphere-system', endpoint: 'dupa-registry-controller.opensphere-system.svc:8080' },
  { id: 'fleet-api', name: 'Fleet API', kind: 'controller', capability: 'fleet.api', version: 'v3', health: 'ok', replicas: 2, updated: '2026-06-29', note: 'ManagedCluster', namespace: 'opensphere-system', endpoint: 'opensphere-fleet-api.opensphere-system.svc:8080' },
  { id: 'fleet-controller', name: 'Fleet Controller', kind: 'controller', capability: 'fleet.reconcile', version: 'v3', health: 'warn', replicas: 1, updated: '2026-06-29', note: '재시작 반복', namespace: 'opensphere-system', endpoint: 'opensphere-fleet-controller.opensphere-system.svc:8080' },
  { id: 'console-backend', name: 'Console Backend', kind: 'host', capability: 'console.bff', version: 'v8', health: 'ok', replicas: 1, updated: '2026-07-02', note: 'BFF', namespace: 'opensphere-system', endpoint: 'console-backend.opensphere-system.svc:8080' },
];

const HEALTH_VALUES: Row2['health'][] = ['ok', 'warn', 'bad'];

type ColumnKey = 'name' | 'kind' | 'capability' | 'version' | 'health' | 'replicas' | 'updated' | 'note';
const COLUMN_DEFS: { key: ColumnKey; label: string; kind: 'text' | 'health' | 'numeric' }[] = [
  { key: 'name', label: '이름', kind: 'text' },
  { key: 'kind', label: '종류', kind: 'text' },
  { key: 'capability', label: 'Capability', kind: 'text' },
  { key: 'version', label: '버전', kind: 'text' },
  { key: 'health', label: '상태', kind: 'health' },
  { key: 'replicas', label: '레플리카', kind: 'numeric' },
  { key: 'updated', label: '갱신', kind: 'text' },
  { key: 'note', label: '비고', kind: 'text' },
];

interface FilterState {
  name: string; kind: string; capability: string; version: string; updated: string; note: string;
  health: Set<Row2['health']>;
  replicasMin: number | null;
  replicasMax: number | null;
}

function emptyFilters(): FilterState {
  return { name: '', kind: '', capability: '', version: '', updated: '', note: '', health: new Set(HEALTH_VALUES), replicasMin: null, replicasMax: null };
}

// 두 번째 DataGrid 시연 — VMware ESXi Host Client(https://<host>:1443/ui/#/host/vms)의 VM 그리드를
// 실제 DOM(k-grid/k-header-column-menu/vui-action-bar 클래스)까지 열어 확인한 뒤 그 UX 패턴(상시 노출
// 툴바 + 열마다 하나의 caret가 정렬/필터/열선택을 겸함 + 빠른 필터 셀렉트)을 clr-datagrid로 재구성한 것 —
// 실제로는 그 화면이 Clarity가 아니라 Kendo UI Grid(k-* 클래스)와 VMware 자체 VUI 프레임워크
// (vui-action-bar 등)로 만들어져 있어(직접 DOM 확인, 2026-07-03) 마크업을 그대로 옮길 수는 없었다 —
// 정렬은 Clarity 기본(열 제목 클릭)에 맡기고, 필터·열선택은 열 caret 하나에 모아 커스텀 구현했다.
@Component({
  selector: 'app-datagrid2-page',
  standalone: true,
  imports: [CommonModule, ClarityModule, ClrDatagridModule, CarbonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dg2-intro">
      <h1>DataGrid 2 — 상시 툴바 + 열 caret 패턴</h1>
      <p>
        VMware ESXi Host Client의 VM 목록 화면을 실제 DOM까지 열어 확인하고 그 UX 패턴을
        <a href="https://clarity.design/documentation/datagrid" target="_blank" rel="noopener">Clarity DataGrid</a>로
        재구성한 두 번째 시연. 상단 액션 바가 <strong>선택 여부와 무관하게 항상 노출</strong>되고(선택이
        필요한 작업만 비활성화), 각 열 제목 옆 caret(⌄) 하나가 <strong>필터 + 열 선택을 겸한다</strong> —
        <a routerLink="." (click)="$event.preventDefault()">앞 페이지</a>(선택 시에만 뜨는 오버레이 툴바,
        액션 열 하나에만 있던 열선택)와 대비되는 배치다.
      </p>
      <p class="dg2-note">
        확인 결과 그 화면은 <code>clr-datagrid</code>가 아니라 <code>k-grid</code>(Kendo UI Grid) 클래스와
        VMware 자체 <code>vui-action-bar</code> 프레임워크로 되어 있었다(직접 DOM 조회, <code>clr-dg-*</code>
        클래스 0건) — 마크업을 그대로 옮기지 않고 <strong>관찰한 UX 패턴만</strong> 우리 Clarity 스택으로
        다시 구현했다. 정렬은 Clarity 기본 동작(열 제목 클릭 시 정렬)을 그대로 쓰고, 필터·열선택만 caret
        메뉴에 모았다(Clarity의 <code>clr-dg-filter</code> 자체 깔때기 아이콘 대신 caret 하나로 통합하려고
        필터는 <code>*ngIf</code> 계산 배열로 직접 구현).
      </p>
    </section>

    <section class="dg2-toolbar">
      <button type="button" class="dg2-tb-btn" (click)="doRegister()">
        <os-cicon [icon]="addIcon" [size]="16" /><span>등록</span>
      </button>
      <span class="dg2-tb-sep"></span>
      <button type="button" class="dg2-tb-btn" [disabled]="selected().length !== 1" (click)="doDetail()">
        <os-cicon [icon]="viewIcon" [size]="16" /><span>상세 보기</span>
      </button>
      <span class="dg2-tb-sep"></span>
      <button type="button" class="dg2-tb-btn" [disabled]="!selected().length" (click)="doAction('시작')">
        <os-cicon [icon]="playIcon" [size]="16" /><span>시작</span>
      </button>
      <button type="button" class="dg2-tb-btn" [disabled]="!selected().length" (click)="doAction('정지')">
        <os-cicon [icon]="stopIcon" [size]="16" /><span>정지</span>
      </button>
      <button type="button" class="dg2-tb-btn" [disabled]="!selected().length" (click)="doAction('일시 중단')">
        <os-cicon [icon]="pauseIcon" [size]="16" /><span>일시 중단</span>
      </button>
      <span class="dg2-tb-sep"></span>
      <button type="button" class="dg2-tb-btn" (click)="doRefresh()">
        <os-cicon [icon]="renewIcon" [size]="16" /><span>새로 고침</span>
      </button>
      <clr-dropdown>
        <button type="button" class="dg2-tb-btn" clrDropdownTrigger>
          <os-cicon [icon]="moreIcon" [size]="16" /><span>작업</span>
        </button>
        <clr-dropdown-menu *clrIfOpen clrPosition="bottom-left">
          <button type="button" clrDropdownItem (click)="doAction('내보내기')">내보내기</button>
          <button type="button" clrDropdownItem (click)="doAction('복제')">복제</button>
          <button type="button" clrDropdownItem (click)="doAction('삭제')">삭제</button>
        </clr-dropdown-menu>
      </clr-dropdown>

      <span class="dg2-search">
        <os-cicon [icon]="searchIcon" [size]="16" />
        <input type="search" placeholder="검색" [value]="searchText()" (input)="setSearch($any($event.target).value)" />
      </span>

      <span class="dg2-tb-msg" *ngIf="message() as msg">{{ msg }}</span>
    </section>

    <clr-datagrid class="dg2-grid" [clrDgSelected]="selected()" (clrDgSelectedChange)="selected.set($event)" [clrDgSelectionType]="selectionType">
      <clr-dg-column *ngIf="visibleCols().name" [clrDgField]="'name'">
        <span class="dg2-col-head">
          이름
          <clr-dropdown>
            <button type="button" class="dg2-col-caret" clrDropdownTrigger aria-label="이름 필터/열 선택" (click)="$event.stopPropagation()">⌄</button>
            <clr-dropdown-menu *clrIfOpen clrPosition="bottom-left" class="dg2-menu">
              <div class="dg2-menu-title">필터</div>
              <input class="dg2-filter-input" type="text" placeholder="이름 포함…" [value]="filters().name" (input)="setFilter('name', $any($event.target).value)" (click)="$event.stopPropagation()" />
              <div class="dg2-menu-divider"></div>
              <div class="dg2-menu-title">열 선택</div>
              <label class="dg2-col-item" *ngFor="let c of columnDefs">
                <input type="checkbox" [checked]="visibleCols()[c.key]" (change)="toggleColumn(c.key, $any($event.target).checked)" />
                <span>{{ c.label }}</span>
              </label>
            </clr-dropdown-menu>
          </clr-dropdown>
        </span>
      </clr-dg-column>

      <clr-dg-column *ngIf="visibleCols().kind" [clrDgField]="'kind'">
        <span class="dg2-col-head">
          종류
          <clr-dropdown>
            <button type="button" class="dg2-col-caret" clrDropdownTrigger aria-label="종류 필터/열 선택" (click)="$event.stopPropagation()">⌄</button>
            <clr-dropdown-menu *clrIfOpen clrPosition="bottom-left" class="dg2-menu">
              <div class="dg2-menu-title">필터</div>
              <input class="dg2-filter-input" type="text" placeholder="종류 포함…" [value]="filters().kind" (input)="setFilter('kind', $any($event.target).value)" (click)="$event.stopPropagation()" />
              <div class="dg2-menu-divider"></div>
              <div class="dg2-menu-title">열 선택</div>
              <label class="dg2-col-item" *ngFor="let c of columnDefs">
                <input type="checkbox" [checked]="visibleCols()[c.key]" (change)="toggleColumn(c.key, $any($event.target).checked)" />
                <span>{{ c.label }}</span>
              </label>
            </clr-dropdown-menu>
          </clr-dropdown>
        </span>
      </clr-dg-column>

      <clr-dg-column *ngIf="visibleCols().capability" [clrDgField]="'capability'">
        <span class="dg2-col-head">
          Capability
          <clr-dropdown>
            <button type="button" class="dg2-col-caret" clrDropdownTrigger aria-label="Capability 필터/열 선택" (click)="$event.stopPropagation()">⌄</button>
            <clr-dropdown-menu *clrIfOpen clrPosition="bottom-left" class="dg2-menu">
              <div class="dg2-menu-title">필터</div>
              <input class="dg2-filter-input" type="text" placeholder="capability 포함…" [value]="filters().capability" (input)="setFilter('capability', $any($event.target).value)" (click)="$event.stopPropagation()" />
              <div class="dg2-menu-divider"></div>
              <div class="dg2-menu-title">열 선택</div>
              <label class="dg2-col-item" *ngFor="let c of columnDefs">
                <input type="checkbox" [checked]="visibleCols()[c.key]" (change)="toggleColumn(c.key, $any($event.target).checked)" />
                <span>{{ c.label }}</span>
              </label>
            </clr-dropdown-menu>
          </clr-dropdown>
        </span>
      </clr-dg-column>

      <clr-dg-column *ngIf="visibleCols().version" [clrDgField]="'version'">
        <span class="dg2-col-head">
          버전
          <clr-dropdown>
            <button type="button" class="dg2-col-caret" clrDropdownTrigger aria-label="버전 필터/열 선택" (click)="$event.stopPropagation()">⌄</button>
            <clr-dropdown-menu *clrIfOpen clrPosition="bottom-left" class="dg2-menu">
              <div class="dg2-menu-title">필터</div>
              <input class="dg2-filter-input" type="text" placeholder="버전 포함…" [value]="filters().version" (input)="setFilter('version', $any($event.target).value)" (click)="$event.stopPropagation()" />
              <div class="dg2-menu-divider"></div>
              <div class="dg2-menu-title">열 선택</div>
              <label class="dg2-col-item" *ngFor="let c of columnDefs">
                <input type="checkbox" [checked]="visibleCols()[c.key]" (change)="toggleColumn(c.key, $any($event.target).checked)" />
                <span>{{ c.label }}</span>
              </label>
            </clr-dropdown-menu>
          </clr-dropdown>
        </span>
      </clr-dg-column>

      <clr-dg-column *ngIf="visibleCols().health" [clrDgField]="'health'">
        <span class="dg2-col-head">
          상태
          <clr-dropdown>
            <button type="button" class="dg2-col-caret" clrDropdownTrigger aria-label="상태 필터/열 선택" (click)="$event.stopPropagation()">⌄</button>
            <clr-dropdown-menu *clrIfOpen clrPosition="bottom-left" class="dg2-menu">
              <div class="dg2-menu-title">필터</div>
              <label class="dg2-col-item" *ngFor="let h of healthValues">
                <input type="checkbox" [checked]="filters().health.has(h)" (change)="toggleHealth(h, $any($event.target).checked)" />
                <span class="label" [ngClass]="healthClass(h)">{{ h }}</span>
              </label>
              <div class="dg2-menu-divider"></div>
              <div class="dg2-menu-title">열 선택</div>
              <label class="dg2-col-item" *ngFor="let c of columnDefs">
                <input type="checkbox" [checked]="visibleCols()[c.key]" (change)="toggleColumn(c.key, $any($event.target).checked)" />
                <span>{{ c.label }}</span>
              </label>
            </clr-dropdown-menu>
          </clr-dropdown>
        </span>
      </clr-dg-column>

      <clr-dg-column *ngIf="visibleCols().replicas" [clrDgField]="'replicas'" [clrDgColType]="'number'">
        <span class="dg2-col-head">
          레플리카
          <clr-dropdown>
            <button type="button" class="dg2-col-caret" clrDropdownTrigger aria-label="레플리카 필터/열 선택" (click)="$event.stopPropagation()">⌄</button>
            <clr-dropdown-menu *clrIfOpen clrPosition="bottom-left" class="dg2-menu">
              <div class="dg2-menu-title">필터</div>
              <div class="dg2-filter-row">
                <input class="dg2-filter-num" type="number" placeholder="최소" [value]="filters().replicasMin" (input)="setReplicasRange('min', $any($event.target).value)" (click)="$event.stopPropagation()" />
                <span>~</span>
                <input class="dg2-filter-num" type="number" placeholder="최대" [value]="filters().replicasMax" (input)="setReplicasRange('max', $any($event.target).value)" (click)="$event.stopPropagation()" />
              </div>
              <div class="dg2-menu-divider"></div>
              <div class="dg2-menu-title">열 선택</div>
              <label class="dg2-col-item" *ngFor="let c of columnDefs">
                <input type="checkbox" [checked]="visibleCols()[c.key]" (change)="toggleColumn(c.key, $any($event.target).checked)" />
                <span>{{ c.label }}</span>
              </label>
            </clr-dropdown-menu>
          </clr-dropdown>
        </span>
      </clr-dg-column>

      <clr-dg-column *ngIf="visibleCols().updated" [clrDgField]="'updated'">
        <span class="dg2-col-head">
          갱신
          <clr-dropdown>
            <button type="button" class="dg2-col-caret" clrDropdownTrigger aria-label="갱신 필터/열 선택" (click)="$event.stopPropagation()">⌄</button>
            <clr-dropdown-menu *clrIfOpen clrPosition="bottom-left" class="dg2-menu">
              <div class="dg2-menu-title">필터</div>
              <input class="dg2-filter-input" type="text" placeholder="날짜 포함…" [value]="filters().updated" (input)="setFilter('updated', $any($event.target).value)" (click)="$event.stopPropagation()" />
              <div class="dg2-menu-divider"></div>
              <div class="dg2-menu-title">열 선택</div>
              <label class="dg2-col-item" *ngFor="let c of columnDefs">
                <input type="checkbox" [checked]="visibleCols()[c.key]" (change)="toggleColumn(c.key, $any($event.target).checked)" />
                <span>{{ c.label }}</span>
              </label>
            </clr-dropdown-menu>
          </clr-dropdown>
        </span>
      </clr-dg-column>

      <clr-dg-column *ngIf="visibleCols().note" [clrDgField]="'note'">
        <span class="dg2-col-head">
          비고
          <clr-dropdown>
            <button type="button" class="dg2-col-caret" clrDropdownTrigger aria-label="비고 필터/열 선택" (click)="$event.stopPropagation()">⌄</button>
            <clr-dropdown-menu *clrIfOpen clrPosition="bottom-left" class="dg2-menu">
              <div class="dg2-menu-title">필터</div>
              <input class="dg2-filter-input" type="text" placeholder="비고 포함…" [value]="filters().note" (input)="setFilter('note', $any($event.target).value)" (click)="$event.stopPropagation()" />
              <div class="dg2-menu-divider"></div>
              <div class="dg2-menu-title">열 선택</div>
              <label class="dg2-col-item" *ngFor="let c of columnDefs">
                <input type="checkbox" [checked]="visibleCols()[c.key]" (change)="toggleColumn(c.key, $any($event.target).checked)" />
                <span>{{ c.label }}</span>
              </label>
            </clr-dropdown-menu>
          </clr-dropdown>
        </span>
      </clr-dg-column>

      <clr-dg-row *clrDgItems="let row of visibleRows(); trackBy: trackById" [clrDgItem]="row">
        <clr-dg-cell *ngIf="visibleCols().name" class="dg2-name-cell">
          <os-cicon [icon]="kindIcon(row.kind)" [size]="16" />
          <a class="dg2-name-link" (click)="selectAndDetail(row)" (keydown.enter)="selectAndDetail(row)" tabindex="0">{{ row.name }}</a>
        </clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().kind">{{ row.kind }}</clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().capability" class="dg2-mono">{{ row.capability }}</clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().version">{{ row.version }}</clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().health"><span class="label" [ngClass]="healthClass(row.health)">{{ row.health }}</span></clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().replicas">{{ row.replicas }}</clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().updated">{{ row.updated }}</clr-dg-cell>
        <clr-dg-cell *ngIf="visibleCols().note">{{ row.note }}</clr-dg-cell>

        <clr-dg-row-detail *clrIfExpanded>
          <dl class="dg2-detail">
            <dt>ID</dt><dd class="dg2-mono">{{ row.id }}</dd>
            <dt>Namespace</dt><dd>{{ row.namespace }}</dd>
            <dt>제공 주소</dt><dd class="dg2-mono">{{ row.endpoint }}</dd>
          </dl>
        </clr-dg-row-detail>
      </clr-dg-row>

      <clr-dg-placeholder>일치하는 항목이 없습니다 — 필터를 조정해보라.</clr-dg-placeholder>

      <clr-dg-footer>
        <select class="dg2-quickfilter" [value]="quickFilter()" (change)="setQuickFilter($any($event.target).value)">
          <option value="all">빠른 필터…</option>
          <option value="ok">정상만 보기</option>
          <option value="warn">경고 이상만</option>
          <option value="bad">오류만</option>
        </select>
        <span class="dg2-footer-count">{{ visibleRows().length }}개 항목</span>
        <clr-dg-pagination #pagination [clrDgPageSize]="5">
          <clr-dg-page-size [clrPageSizeOptions]="[5, 10, 20]">페이지당</clr-dg-page-size>
          {{ pagination.firstItem + 1 }} - {{ pagination.lastItem + 1 }} / {{ pagination.totalItems }}
        </clr-dg-pagination>
      </clr-dg-footer>
    </clr-datagrid>
  `,
  styles: [`
    :host { display: block; }
    .dg2-intro h1 { margin: 0 0 0.4rem; font-size: 1.5rem; font-weight: 300; color: #161616; }
    .dg2-intro p { margin: 0 0 0.6rem; max-width: 60rem; color: #525252; font-size: 0.9rem; line-height: 1.55; }
    .dg2-intro a { color: #4c6fff; }
    .dg2-note { font-size: 0.8rem; color: #6f6f6f; background: #f4f4f4; border-left: 3px solid #8c8c8c; padding: 0.5rem 0.8rem; }
    .dg2-note code { background: #eef0f3; padding: 0.05rem 0.3rem; border-radius: 3px; font-size: 0.9em; }

    /* 상시 노출 툴바 — 선택 여부와 무관하게 항상 자리를 차지(높이 고정)해 메시지가 뜨고 져도
       레이아웃이 흔들리지 않는다(앞 페이지의 조건부 오버레이 바와 의도적으로 다른 방식). */
    /* ESXi 원본 실측: 툴바 background=transparent, border=none(박스 없이 평평함) — 우리도 동일하게 */
    .dg2-toolbar { display: flex; align-items: center; gap: 0.15rem; padding: 0.4rem 0.2rem; margin: 1rem 0; min-height: 2.4rem; flex-wrap: wrap; border-bottom: 1px solid #e0e0e0; }
    .dg2-tb-btn { display: inline-flex; align-items: center; gap: 0.35rem; border: 1px solid transparent; background: transparent; color: #303ab2; font-size: 0.8rem; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; }
    .dg2-tb-btn:hover:not(:disabled) { background: #eef2ff; }
    .dg2-tb-btn:disabled { color: #b0b0b0; cursor: not-allowed; }
    .dg2-tb-sep { width: 1px; height: 1.2rem; background: #d8d8d8; margin: 0 0.2rem; }
    /* 빠른 필터 — ESXi 원본처럼 툴바가 아니라 그리드 하단(footer, 항목 수 앞)에 배치 */
    .dg2-quickfilter { margin-right: 0.75rem; font-size: 0.78rem; padding: 0.25rem 0.4rem; border: 1px solid #c6c6c6; border-radius: 4px; color: #525252; background: #fff; }
    .dg2-tb-msg { font-size: 0.78rem; color: #0f8a65; font-style: italic; margin-left: 0.6rem; white-space: nowrap; }

    /* ESXi 원본은 검색창도 박스 없이 아이콘+placeholder만(밑줄만 hover/focus 시) */
    .dg2-search { display: inline-flex; align-items: center; gap: 0.3rem; margin-left: auto; padding: 0.25rem 0.3rem; border-bottom: 1px solid transparent; color: #8c8c8c; }
    .dg2-search input[type='search'] { border: none; outline: none; font-size: 0.8rem; width: 9rem; color: #161616; background: transparent; }
    .dg2-search:focus-within { border-bottom-color: #4c6fff; }

    .dg2-name-cell { display: inline-flex; align-items: center; gap: 0.4rem; }
    .dg2-name-link { color: rgb(60, 120, 163); cursor: pointer; text-decoration: none; }
    .dg2-name-link:hover { text-decoration: underline; }

    .dg2-grid { --clr-thead-bgcolor: #e0e0e0; }
    /* .datagrid-column-title·.datagrid-filter-toggle는 Clarity 자신의 컴포넌트가 그리는 요소라
       이 컴포넌트의 _ngcontent 속성이 안 붙는다(실측: getAttributeNames에 _ngcontent 없음) — 그래서
       평범한 스코프 셀렉터는 절대 안 먹는다(display:none !important를 줘도 계산된 display가 block으로
       실측됨). CSS 커스텀 프로퍼티(--clr-thead-bgcolor 등)는 상속으로 통과되지만 일반 선택자는 안
       통과되므로 ::ng-deep으로 캡슐화를 뚫어야 한다. */
    .dg2-grid ::ng-deep .datagrid-column-title { color: #525252; }
    /* Clarity가 clrDgField 있는 컬럼마다 자동으로 붙이는 기본 필터 토글(cds-icon 포함) — 필터·열선택은
       이미 caret 하나에 다 모아뒀으므로 중복이라 숨긴다(실측: ESXi엔 이런 이중 표시가 없음). */
    .dg2-grid ::ng-deep .datagrid-filter-toggle { display: none !important; }
    .dg2-mono { font-family: var(--os-font-mono, 'Courier New', monospace); font-size: 0.78rem; }
    .dg2-footer-count { margin: 0 0.75rem; font-size: 0.8rem; color: #6f6f6f; }
    clr-dg-cell .label { vertical-align: middle; }

    /* 열 제목 + caret — 정렬은 Clarity 기본(제목 클릭)에 맡기고 caret은 필터/열선택 전용 */
    .dg2-col-head { display: inline-flex; align-items: center; gap: 0.2rem; }
    .dg2-col-caret { border: none; background: transparent; color: inherit; font-size: 0.9rem; line-height: 1; cursor: pointer; padding: 0.3rem 0.35rem !important; margin: -0.3rem 0; border-radius: 3px; }
    .dg2-col-caret:hover { background: rgba(0, 0, 0, 0.06); color: #4c6fff; }
    .dg2-menu.dg2-menu { padding: 0.4rem 0; min-width: 11rem; }
    .dg2-menu-title { padding: 0.25rem 0.8rem; font-size: 0.7rem; font-weight: 600; color: #6f6f6f; text-transform: uppercase; letter-spacing: 0.03em; }
    .dg2-menu-divider { height: 1px; background: #eee; margin: 0.3rem 0; }
    .dg2-col-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.8rem; font-size: 0.82rem; font-weight: 400; cursor: pointer; }
    .dg2-col-item:hover { background: #f4f4f4; }
    .dg2-filter-input { display: block; width: calc(100% - 1.6rem); margin: 0.1rem 0.8rem 0.3rem; padding: 0.3rem 0.5rem; font-size: 0.8rem; border: 1px solid #c6c6c6; border-radius: 4px; }
    .dg2-filter-input:focus { outline: none; border-color: #4c6fff; }
    .dg2-filter-row { display: flex; align-items: center; gap: 0.4rem; margin: 0.1rem 0.8rem 0.3rem; }
    .dg2-filter-num { width: 4.2rem; padding: 0.3rem 0.4rem; font-size: 0.8rem; border: 1px solid #c6c6c6; border-radius: 4px; }
    .dg2-filter-num:focus { outline: none; border-color: #4c6fff; }

    .dg2-detail { display: grid; grid-template-columns: 8rem 1fr; gap: 0.5rem 1rem; margin: 0; padding: 0.8rem 1.1rem; }
    .dg2-detail dt { color: #6f6f6f; font-size: 0.78rem; }
    .dg2-detail dd { margin: 0; font-size: 0.82rem; color: #161616; overflow-wrap: anywhere; }
  `],
})
export class DataGrid2PageComponent {
  readonly rows = signal<Row2[]>(ROWS);
  readonly selectionType = SelectionType.Multi;
  readonly selected = signal<Row2[]>([]);
  readonly healthValues = HEALTH_VALUES;
  readonly quickFilter = signal<'all' | Row2['health']>('all');
  readonly searchText = signal('');
  readonly message = signal<string | null>(null);

  readonly addIcon = Add16;
  readonly viewIcon = View16;
  readonly playIcon = Play16;
  readonly stopIcon = Stop16;
  readonly pauseIcon = Pause16;
  readonly renewIcon = Renew16;
  readonly moreIcon = OverflowMenuHorizontal16;
  readonly searchIcon = Search16;
  private readonly kindIcons: Record<string, IconNode> = { plugin: Plug16, host: BareMetalServer16, controller: Gears16 };

  readonly columnDefs = COLUMN_DEFS;
  readonly visibleCols = signal<Record<ColumnKey, boolean>>(
    Object.fromEntries(COLUMN_DEFS.map((c) => [c.key, true])) as Record<ColumnKey, boolean>
  );
  readonly filters = signal<FilterState>(emptyFilters());

  readonly visibleRows = computed(() => {
    const f = this.filters();
    const q = this.searchText().trim().toLowerCase();
    return this.rows().filter((row) => {
      if (q && !`${row.name} ${row.kind} ${row.capability} ${row.version} ${row.note}`.toLowerCase().includes(q)) return false;
      if (f.name && !row.name.toLowerCase().includes(f.name.toLowerCase())) return false;
      if (f.kind && !row.kind.toLowerCase().includes(f.kind.toLowerCase())) return false;
      if (f.capability && !row.capability.toLowerCase().includes(f.capability.toLowerCase())) return false;
      if (f.version && !row.version.toLowerCase().includes(f.version.toLowerCase())) return false;
      if (f.updated && !row.updated.toLowerCase().includes(f.updated.toLowerCase())) return false;
      if (f.note && !row.note.toLowerCase().includes(f.note.toLowerCase())) return false;
      if (!f.health.has(row.health)) return false;
      if (f.replicasMin != null && row.replicas < f.replicasMin) return false;
      if (f.replicasMax != null && row.replicas > f.replicasMax) return false;
      return true;
    });
  });

  trackById(_: number, row: Row2): string { return row.id; }

  kindIcon(kind: string): IconNode {
    return this.kindIcons[kind] ?? this.kindIcons['plugin'];
  }

  setSearch(value: string): void {
    this.searchText.set(value);
  }

  healthClass(h: Row2['health']): string {
    return h === 'ok' ? 'label-success' : h === 'warn' ? 'label-warning' : 'label-danger';
  }

  setFilter(key: 'name' | 'kind' | 'capability' | 'version' | 'updated' | 'note', value: string): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
  }

  setReplicasRange(bound: 'min' | 'max', raw: string): void {
    const n = raw === '' ? null : Number(raw);
    this.filters.update((f) => (bound === 'min' ? { ...f, replicasMin: n } : { ...f, replicasMax: n }));
  }

  toggleHealth(h: Row2['health'], checked: boolean): void {
    this.filters.update((f) => {
      const next = new Set(f.health);
      if (checked) next.add(h); else next.delete(h);
      return { ...f, health: next };
    });
  }

  setQuickFilter(value: 'all' | Row2['health']): void {
    this.quickFilter.set(value);
    this.filters.update((f) => ({ ...f, health: value === 'all' ? new Set(HEALTH_VALUES) : new Set([value]) }));
  }

  toggleColumn(key: ColumnKey, checked: boolean): void {
    const current = this.visibleCols();
    const visibleCount = Object.values(current).filter(Boolean).length;
    if (!checked && visibleCount <= 1 && current[key]) return;
    this.visibleCols.set({ ...current, [key]: checked });
  }

  doRegister(): void {
    this.flash('등록 폼 열기 요청됨');
  }

  doDetail(): void {
    const row = this.selected()[0];
    this.flash(row ? `${row.name} 상세 보기 요청됨` : '항목을 선택하라');
  }

  selectAndDetail(row: Row2): void {
    this.selected.set([row]);
    this.flash(`${row.name} 상세 보기 요청됨`);
  }

  doAction(label: string): void {
    const n = this.selected().length;
    this.flash(n ? `${n}개 항목 ${label} 요청됨` : `${label} 요청됨`);
  }

  doRefresh(): void {
    this.flash('새로 고침됨');
  }

  private flash(msg: string): void {
    this.message.set(msg);
    setTimeout(() => this.message.set(null), 2500);
  }
}
