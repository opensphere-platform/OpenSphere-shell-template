import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FONT_FAMILIES } from '@triangles/design-kit';

interface TypeRole {
  role: string; sample: string; sizeRem: number; sizePx: number; weight: number; family: 'sans' | 'mono';
  transform?: 'uppercase'; usage: string;
}

// 이 프로젝트에서 실제로 쓰는 타입 스케일 — os-* 유틸(.os-h2/.os-sech/.os-sub/.cc-crumbs/.cm-brand 등)에서
// 2026-07-03 grep으로 뽑은 실측 rem 값. Carbon처럼 '역할(role) 단위 스케일'로 재정리했다(원본은 각 subShell CSS에
// 25개 넘는 개별 rem 값이 흩어져 있어 — 아직 Carbon 수준으로 전부 정규화되진 않았다는 뜻이기도 하다).
const ROLES: TypeRole[] = [
  { role: '히어로 타이틀', sample: '플랫폼 운영의 기둥', sizeRem: 1.9, sizePx: 30, weight: 300, family: 'sans', usage: 'Overview 히어로(.ov-h1) — foundation 1.9rem, shell-template는 clamp(2.5–3.5rem)' },
  { role: '섹션 제목', sample: 'Foundation', sizeRem: 1.15, sizePx: 18, weight: 400, family: 'sans', usage: '.os-h2 — 페이지 최상단 제목' },
  { role: '서브섹션 라벨', sample: 'Capability 도메인', sizeRem: 0.9, sizePx: 14, weight: 500, family: 'sans', usage: '.os-sech — 섹션 구분 라벨' },
  { role: '내비 브랜드', sample: 'Foundation', sizeRem: 0.875, sizePx: 14, weight: 600, family: 'sans', usage: '.cm-brand strong — 좌측 내비 상단' },
  { role: '본문 기본', sample: '공용 관계형 데이터베이스 capability · CloudNativePG.', sizeRem: 0.875, sizePx: 14, weight: 400, family: 'sans', usage: ':host 기본값 — 셸 전역 base font-size' },
  { role: '내비 링크', sample: 'PostgreSQL · OpenSearch · RustFS', sizeRem: 0.8, sizePx: 12.8, weight: 400, family: 'sans', usage: '.cm-nav a — 좌측 내비 항목' },
  { role: '서브 텍스트', sample: 'Foundation(host)에 귀속된 plugin을 등록·상태·수명주기로 통치.', sizeRem: 0.8, sizePx: 12.8, weight: 400, family: 'sans', usage: '.os-sub — 제목 아래 설명문' },
  { role: '페이지 경로', sample: 'OpenSphere / Foundation / PostgreSQL', sizeRem: 0.8125, sizePx: 13, weight: 400, family: 'sans', usage: '.cc-crumbs — breadcrumb 바' },
  { role: '오버라인 라벨', sample: 'FOUNDATION SERVICE STACK', sizeRem: 0.68, sizePx: 10.9, weight: 600, family: 'sans', transform: 'uppercase', usage: '.ov-eyebrow — 히어로 위 카테고리 라벨' },
  { role: '메트릭 숫자', sample: '2/6', sizeRem: 1.6, sizePx: 25.6, weight: 300, family: 'sans', usage: '.os-num — KPI 타일 큰 숫자' },
  { role: '코드/모노', sample: 'opensphere-pg-rw.opensphere-foundation.svc:5432', sizeRem: 0.78, sizePx: 12.5, weight: 400, family: 'mono', usage: '.os-mono — 엔드포인트·YAML·키값' },
  { role: '마이크로 라벨', sample: 'INSTANCES READY', sizeRem: 0.6, sizePx: 9.6, weight: 400, family: 'sans', transform: 'uppercase', usage: '.os-lbl — 메트릭 타일 캡션' },
];

// Carbon 공식 Productive 타입 스케일(참고표) — carbondesignsystem.com/elements/typography/overview/ 기준.
// 라이브 fetch가 안 돼(JS 렌더 SPA) 공개 문서 기억에 근거한 근사치 — 최신/정확한 값은 원본 확인 권장.
// weight가 커질수록(heading 05~07) 오히려 가벼워지는 것(300)이 Carbon의 특징적 선택.
const CARBON_SCALE = [
  { token: 'code-01', px: 12, weight: 400, family: 'mono' as const },
  { token: 'code-02', px: 14, weight: 400, family: 'mono' as const },
  { token: 'label-01 / helper-text-01', px: 12, weight: 400, family: 'sans' as const },
  { token: 'label-02', px: 14, weight: 400, family: 'sans' as const },
  { token: 'body-compact-01 / body-01', px: 14, weight: 400, family: 'sans' as const },
  { token: 'body-compact-02 / body-02', px: 16, weight: 400, family: 'sans' as const },
  { token: 'heading-01', px: 14, weight: 600, family: 'sans' as const },
  { token: 'heading-02', px: 16, weight: 600, family: 'sans' as const },
  { token: 'heading-03', px: 20, weight: 400, family: 'sans' as const },
  { token: 'heading-04', px: 28, weight: 400, family: 'sans' as const },
  { token: 'heading-05', px: 32, weight: 400, family: 'sans' as const },
  { token: 'heading-06', px: 42, weight: 300, family: 'sans' as const },
  { token: 'heading-07', px: 54, weight: 300, family: 'sans' as const },
];

// Typography 안내 — https://carbondesignsystem.com/elements/typography/overview/ 참고.
// 상단: 실제 로드되는 폰트 패밀리/웨이트/토큰(콘솔 styles.scss 실측). 중단: 이 프로젝트가 실사용하는 역할별
// 타입 스케일(라이브 명세 — 실제 font-family·size·weight로 렌더). 하단: Carbon 공식 스케일 참고 + h1/h2/h3 함정 노트.
@Component({
  selector: 'app-typography-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ty-intro">
      <h1>Typography</h1>
      <p>
        OpenSphere는 <a href="https://carbondesignsystem.com/elements/typography/overview/" target="_blank" rel="noopener">Carbon Design System 타이포그래피</a>의
        서체 자산(IBM Plex)만 차용한다 — 아이콘과 더불어 Clarity UI 위에 허용된 두 가지 Carbon 리소스 중 하나다.
      </p>
    </section>

    <section class="ty-block">
      <h2>서체 패밀리 &amp; 토큰</h2>
      <table class="ty-table">
        <thead><tr><th>용도</th><th>font-family</th><th>웨이트</th><th>로딩</th></tr></thead>
        <tbody>
          <tr *ngFor="let f of fontFamilies">
            <td>{{ f.usage }}</td><td class="ty-ff">{{ f.family }}</td><td>{{ f.weights }}</td><td>{{ f.loading }}</td>
          </tr>
        </tbody>
      </table>
      <div class="ty-tokens">
        <code>--os-font: "IBM Plex Sans", "IBM Plex Sans KR", system-ui, "Segoe UI", sans-serif;</code>
        <code>--os-font-mono: "IBM Plex Mono", ui-monospace, "Cascadia Code", monospace;</code>
      </div>
      <p class="ty-note-p">각 subShell은 <code>:host</code>에서 <code>font-family: var(--os-font, &lt;폴백 체인&gt;)</code>로 이 토큰을 상속한다 —
        콘솔 안에서는 IBM Plex Sans, standalone 프리뷰에서는 폴백(Metropolis 등)으로 조용히 내려간다.</p>
    </section>

    <section class="ty-block">
      <h2>실사용 타입 스케일 <span class="ty-badge">라이브 명세</span></h2>
      <p class="ty-note-p">아래는 이 프로젝트 CSS(<code>os-*</code> 유틸)에서 실제로 쓰는 값 그대로 렌더한 것 — 카탈로그가 아니라 실측치다.</p>
      <div class="ty-specimen" *ngFor="let r of roles">
        <div class="ty-sample"
             [style.font-family]="fontVar(r.family)"
             [style.font-size.rem]="r.sizeRem" [style.font-weight]="r.weight"
             [style.text-transform]="r.transform || 'none'">{{ r.sample }}</div>
        <div class="ty-meta">
          <span class="ty-role">{{ r.role }}</span>
          <span class="ty-dims">{{ r.sizeRem }}rem <i>({{ r.sizePx }}px)</i> · {{ r.weight }} · {{ r.family === 'mono' ? 'Mono' : 'Sans' }}</span>
          <span class="ty-usage">{{ r.usage }}</span>
        </div>
      </div>
    </section>

    <section class="ty-block">
      <h2>Carbon 공식 스케일 <span class="ty-badge ty-badge--ref">참고</span></h2>
      <p class="ty-note-p">Carbon Productive 타입 스케일(근사치 — 원본은 위 링크에서 확인). heading 05~07처럼 커질수록 웨이트가 오히려
        가벼워지는(300) 것이 Carbon 특유의 선택이다.</p>
      <table class="ty-table ty-table--compact">
        <thead><tr><th>토큰</th><th>크기</th><th>웨이트</th><th>패밀리</th></tr></thead>
        <tbody>
          <tr *ngFor="let c of carbonScale">
            <td class="ty-ff">{{ c.token }}</td><td>{{ c.px }}px</td><td>{{ c.weight }}</td><td>{{ c.family === 'mono' ? 'Mono' : 'Sans' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="ty-note">
      <h2>함정 — heading이 조용히 다른 폰트로 렌더될 수 있다</h2>
      <p>
        <code>:host &#123; font-family: var(--os-font, ...) &#125;</code> 선언만으로는 <strong>h1/h2/h3에 안 먹힌다.</strong>
        Clarity <code>clr-ui.min.css</code>가 <code>h1:not([cds-text])</code>를 명시적으로 매칭해
        <code>--clr-h1-font-family → --clr-display-font → --clr-metropolis-font-family</code>(값=하드코딩 Metropolis)로
        고정하기 때문 — 명시적 매칭 규칙은 특이도와 무관하게 상속을 항상 이긴다. 본문(p/span)은 정상인데 heading만
        Metropolis로 남는 시각적 불일치가 생긴다. 해결: <code>:host</code>에서 <code>--clr-metropolis-font-family</code>
        토큰 자체를 <code>var(--os-font, ...)</code>로 재정의(4개 subShell 전부 적용·검증됨).
      </p>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .ty-intro h1 { margin: 0 0 0.4rem; font-size: 1.7rem; font-weight: 300; color: #161616; }
    .ty-intro p { margin: 0 0 1.6rem; max-width: 52rem; color: #525252; font-size: 0.9rem; line-height: 1.55; }
    .ty-intro a { color: #4c6fff; }

    .ty-block { margin: 0 0 2.2rem; max-width: 56rem; }
    .ty-block h2 { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.6rem; font-size: 1.05rem; font-weight: 600; color: #161616; }
    .ty-badge { font-size: 0.62rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #0f62fe; background: #edf5ff; border-radius: 3px; padding: 0.15rem 0.5rem; }
    .ty-badge--ref { color: #6f6f6f; background: #f4f4f4; }
    .ty-note-p { margin: 0 0 0.9rem; font-size: 0.82rem; color: #525252; line-height: 1.55; }
    .ty-note-p code { background: #eef0f3; padding: 0.05rem 0.3rem; border-radius: 3px; font-size: 0.85em; }

    .ty-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e0e0e0; margin-bottom: 0.7rem; }
    .ty-table th { text-align: left; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: #525252; background: #e0e0e0; padding: 0.55rem 0.8rem; border-bottom: 1px solid #c6c6c6; }
    .ty-table td { padding: 0.55rem 0.8rem; font-size: 0.82rem; color: #161616; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    .ty-table--compact td, .ty-table--compact th { padding: 0.4rem 0.8rem; font-size: 0.78rem; }
    .ty-ff { font-family: var(--os-font-mono, 'Courier New', monospace); }
    .ty-tokens { display: flex; flex-direction: column; gap: 0.3rem; background: #f4f4f4; border-radius: 4px; padding: 0.7rem 0.9rem; margin-bottom: 0.6rem; }
    .ty-tokens code { font-family: var(--os-font-mono, 'Courier New', monospace); font-size: 0.76rem; color: #161616; }

    .ty-specimen { display: grid; grid-template-columns: minmax(0,1fr) 16rem; gap: 1rem; align-items: baseline; padding: 0.9rem 0; border-bottom: 1px solid #e0e0e0; }
    .ty-sample { color: #161616; overflow-wrap: anywhere; }
    .ty-meta { display: flex; flex-direction: column; gap: 0.15rem; text-align: right; }
    .ty-role { font-size: 0.78rem; font-weight: 600; color: #161616; }
    .ty-dims { font-size: 0.72rem; color: #6f6f6f; font-family: var(--os-font-mono, 'Courier New', monospace); }
    .ty-dims i { font-style: normal; }
    .ty-usage { font-size: 0.7rem; color: #8c8c8c; line-height: 1.4; }

    .ty-note { max-width: 56rem; padding: 1rem 1.1rem; background: #f4f4f4; border-left: 3px solid #0f62fe; border-radius: 2px; }
    .ty-note h2 { margin: 0 0 0.4rem; font-size: 0.95rem; font-weight: 600; color: #161616; }
    .ty-note p { margin: 0; font-size: 0.82rem; color: #525252; line-height: 1.6; }
    .ty-note code { background: #fff; padding: 0.05rem 0.3rem; border-radius: 3px; font-size: 0.85em; }

    @media (max-width: 700px) { .ty-specimen { grid-template-columns: 1fr; } .ty-meta { text-align: left; } }
  `],
})
export class TypographyPageComponent {
  readonly fontFamilies = FONT_FAMILIES;
  readonly roles = ROLES;
  readonly carbonScale = CARBON_SCALE;

  fontVar(family: 'sans' | 'mono'): string {
    return family === 'mono'
      ? "var(--os-font-mono, 'Courier New', monospace)"
      : "var(--os-font, 'IBM Plex Sans', sans-serif)";
  }
}
