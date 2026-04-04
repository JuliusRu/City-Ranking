export function ratingToDisplay(rating: number): string {
  return (rating / 10).toFixed(1);
}

export function ratingToColor(rating: number): string {
  // 0 = red, 50 = yellow, 100 = green — returns hex for Cesium compatibility
  const hue = (rating / 100) * 120;
  return hslToHex(hue, 80, 50);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
