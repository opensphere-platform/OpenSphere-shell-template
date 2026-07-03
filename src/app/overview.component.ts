import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CarbonIcon } from '@triangles/design-kit';
import Launch16 from '@carbon/icons/es/launch/16';
import Information20 from '@carbon/icons/es/information/20';
import Code32 from '@carbon/icons/es/code/32';
import Kubernetes32 from '@carbon/icons/es/kubernetes/32';
import ContainerRegistry32 from '@carbon/icons/es/container-registry/32';

interface JumpCard { title: string; sub: string; icon: any }

/**
 * OverviewComponent — Shell Template 개요(컨테이너 섹션 데모). 히어로 + 프로모 + Jump in 카드 + 대시보드.
 * 표준 overview 콘텐츠 예시(다른 셸이 참고). 배경은 호스트 .os-content가 공통 토큰으로 제공.
 */
@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CarbonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ov-hero">
      <div class="ov-hero__copy">
        <h1>Run and manage containerized applications</h1>
        <p>From Kubernetes and Red Hat OpenShift, to Serverless solutions, we’ve got you covered.</p>
      </div>
      <div class="ov-hero__art" aria-hidden="true">
        <img src="/ibm-assets/containers-pillar-overview-header.svg" alt="" />
      </div>
    </section>

    <section class="ov-promo">
      <os-cicon [icon]="iInfo" [size]="20" />
      <div>
        <strong>50% savings for 6 months with promo code TRYCONTAINERS</strong>
        <p>For a limited time, use this promo code to save on selected container services.</p>
      </div>
      <a class="ov-link" href="#claim" (click)="$event.preventDefault()">Claim now</a>
    </section>

    <section class="ov-section">
      <h2>Jump in</h2>
      <div class="ov-jump-grid">
        @for (c of jumpCards; track c.title) {
          <div class="ov-action-card">
            <os-cicon [icon]="c.icon" [size]="32" />
            <h3>{{ c.title }}</h3>
            <p>{{ c.sub }}</p>
          </div>
        }
      </div>
    </section>

    <section class="ov-section">
      <h2>Dashboard</h2>
      <div class="ov-dash-grid">
        <div class="ov-inv-card">
          <div class="ov-card-h"><h3>Inventory</h3></div>
          <ul>
            @for (r of inventory; track r.label) {
              <li><span>{{ r.label }}</span><a class="ov-link" href="#" (click)="$event.preventDefault()">{{ r.n }}</a></li>
            }
          </ul>
        </div>
        <div class="ov-side-card">
          <h3>Jump back in</h3>
          <p>Your recently used resources will appear here.</p>
        </div>
        <div class="ov-side-card">
          <h3>Explore the docs</h3>
          <p>Find tutorials, CLI references, and service guides.</p>
          <a class="ov-link ov-link--icon" href="#docs" (click)="$event.preventDefault()">Open docs <os-cicon [icon]="iLaunch" [size]="16" /></a>
        </div>
      </div>
    </section>

    <!-- 박스 비교 — 위 "Jump in"은 Clarity .card가 아니라 Carbon Tile 룩(테두리·그림자 없음, 헤어라인 간격)을
         커스텀 CSS(.ov-action-card)로 재현한 것. 같은 3개 카드를 Clarity 실제 .card(box-shadow·border-radius·border
         토큰 + .card-header/.card-block 구조)로 렌더 — foundation(services/keycloak/samba)이 이미 쓰는 정본 마크업. -->
    <section class="ov-section ov-compare">
      <h2>박스 비교 — 현재(Carbon Tile) vs Clarity Card</h2>
      <p class="ov-compare-note">
        위 "Jump in"의 박스(<code>.ov-action-card</code>)는 Clarity 컴포넌트가 아니라 테두리·그림자 없이 흰 배경 +
        헤어라인 간격(0.0625rem)만 있는 <strong>Carbon Tile 룩을 커스텀 CSS로 재현</strong>한 것이다. 아래는 같은
        3개 카드를 <strong>Clarity 실제 <code>.card</code></strong>(<code>box-shadow</code>·<code>border-radius</code>·
        <code>border</code> 토큰 + <code>.card-header</code>/<code>.card-block</code> 구조 — foundation이 이미 이 마크업을 씀)로
        그대로 렌더한 것 — 테두리·모서리 둥글기·그림자 유무를 눈으로 비교해보라.
      </p>
      <div class="ov-jump-grid ov-clarity-grid">
        @for (c of jumpCards; track c.title) {
          <div class="card">
            <div class="card-header">{{ c.title }}</div>
            <div class="card-block">
              <os-cicon [icon]="c.icon" [size]="32" />
              <p class="card-text">{{ c.sub }}</p>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: #161616; }
    .ov-hero, .ov-promo, .ov-section { max-width: 87rem; }
    .ov-hero { display: grid; align-items: center; min-height: 15rem; grid-template-columns: minmax(0,1fr) 22rem; padding: 0.5rem 0 2rem; }
    .ov-hero__copy h1 { max-width: 43rem; margin: 0; font-size: clamp(2.5rem, 4vw, 3.5rem); font-weight: 300; letter-spacing: -0.03em; line-height: 1.05; }
    .ov-hero__copy p { max-width: 42rem; margin: 1.1rem 0 0; color: #525252; font-size: 1.05rem; line-height: 1.45; }
    .ov-hero__art { height: 13rem; transform: scale(0.85); transform-origin: center right; }
    .ov-hero__art img { display: block; height: 100%; width: 100%; object-fit: contain; object-position: right center; }

    .ov-promo { display: grid; grid-template-columns: auto 1fr auto; align-items: flex-start; gap: 2rem; margin: 0 0 2.25rem; padding: 0.875rem 1rem; background: #edf5ff; border: 1px solid #0f62fe; }
    .ov-promo > os-cicon { color: #0f62fe; margin-block-start: 0.125rem; }
    .ov-promo strong { display: block; margin-block-end: 0.25rem; font-weight: 400; color: #161616; }
    .ov-promo p { margin: 0; color: #525252; font-size: 0.875rem; }

    .ov-section { margin: 0 0 2.25rem; }
    .ov-section h2 { margin: 0 0 0.75rem; font-size: 1.5rem; font-weight: 400; color: #161616; }
    .ov-jump-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 0.0625rem; }
    .ov-action-card { display: flex; flex-direction: column; min-height: 10.5rem; padding: 1rem; background: #fff; }
    .ov-action-card os-cicon { color: #525252; order: 3; margin-block-start: auto; }
    .ov-action-card h3 { margin: 0 0 0.75rem; font-size: 1.125rem; font-weight: 400; line-height: 1.3; color: #161616; }
    .ov-action-card p { margin: 0; color: #525252; font-size: 0.875rem; line-height: 1.45; }

    .ov-dash-grid { display: grid; grid-template-columns: 1.35fr 1fr 1fr; gap: 0.0625rem; }
    .ov-inv-card, .ov-side-card { min-height: 12rem; padding: 1rem; background: #fff; }
    .ov-card-h h3, .ov-side-card h3 { margin: 0 0 1rem; font-size: 1.125rem; font-weight: 400; color: #161616; }
    .ov-inv-card ul { padding: 0; margin: 1.5rem 0 0; list-style: none; }
    .ov-inv-card li { display: grid; grid-template-columns: 1fr auto; align-items: center; min-height: 2.75rem; border-block-end: 1px solid #e0e0e0; }
    .ov-inv-card li span { color: #525252; }
    .ov-side-card p { margin: 0 0 1rem; color: #525252; font-size: 0.875rem; line-height: 1.45; }
    .ov-link { color: #0f62fe; text-decoration: none; cursor: pointer; }
    .ov-link:hover { text-decoration: underline; }
    .ov-link--icon { display: inline-flex; align-items: center; gap: 0.35rem; }

    /* 박스 비교 — 위 Tile 그리드는 헤어라인(0.0625rem)만 쓰지만, Clarity .card는 자체 그림자·테두리가 있어
       카드 간 실제 여백(1rem)이 필요하다. .card/.card-header/.card-block 자체 스타일은 건드리지 않는다(비교 목적). */
    .ov-compare { padding-top: 1.5rem; border-top: 1px solid #e0e0e0; }
    .ov-compare-note { max-width: 52rem; margin: 0 0 1.1rem; color: #525252; font-size: 0.875rem; line-height: 1.55; }
    .ov-compare-note code { background: #eef0f3; padding: 0.05rem 0.3rem; border-radius: 3px; font-size: 0.85em; }
    .ov-clarity-grid { gap: 1rem; }
    .ov-clarity-grid .card-block { display: flex; flex-direction: column; gap: 0.6rem; }
    .ov-clarity-grid .card-block os-cicon { color: #525252; }

    @media screen and (max-width: 66rem) {
      .ov-hero, .ov-jump-grid, .ov-dash-grid { grid-template-columns: 1fr; }
      .ov-hero__art { display: none; }
    }
  `],
})
export class OverviewComponent {
  readonly iInfo = Information20;
  readonly iLaunch = Launch16;
  readonly jumpCards: JumpCard[] = [
    { title: 'Run code, jobs, or container images', sub: 'Deploy serverless workloads.', icon: Code32 },
    { title: 'Create a cluster', sub: 'Build Kubernetes or OpenShift clusters for production apps.', icon: Kubernetes32 },
    { title: 'Browse deployable architectures', sub: 'Start from reusable templates.', icon: ContainerRegistry32 },
  ];
  readonly inventory = [
    { label: 'Serverless projects', n: 0 },
    { label: 'Clusters', n: 0 },
    { label: 'Namespaces', n: 0 },
  ];
}
