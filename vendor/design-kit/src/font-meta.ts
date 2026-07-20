export interface FontFamilyMeta {
  usage: string;
  family: string;
  weights: string;
  loading: string;
}

export const FONT_FAMILIES: FontFamilyMeta[] = [
  {
    usage: '본문(Sans)',
    family: '"IBM Plex Sans", "IBM Plex Sans KR"',
    weights: '300 · 400 · 500 · 600 · 700',
    loading: 'Google Fonts CDN — fonts.googleapis.com',
  },
  {
    usage: '코드(Mono)',
    family: '"IBM Plex Mono"',
    weights: '400 · 600',
    loading: 'Google Fonts CDN — fonts.googleapis.com',
  },
];
