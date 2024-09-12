// HSL -> RGB 변환 함수
export const hslToRgb = (h: number, s: number, l: number): number[] => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
};

// RGB -> HEX 변환 함수
export const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;

// HSL 색상 값 생성 후 HEX 변환
export const getHSLColor = (
  HUE: number,
  SAT: number,
  LIGHT: number,
  value: number
): string => {
  const lightness = 100 - (100 - LIGHT) * value;

  const rgb = hslToRgb(HUE, SAT, lightness);
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
};
