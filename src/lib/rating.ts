export function ratingToDisplay(rating: number): string {
  return (rating / 10).toFixed(1);
}

export function ratingToColor(rating: number): string {
  // 0 = red, 50 = yellow, 100 = green
  const hue = (rating / 100) * 120;
  return `hsl(${hue}, 80%, 50%)`;
}
