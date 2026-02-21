export function generateCSP(nonce: string): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' blob:`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org`,
    `font-src 'self'`,
    `connect-src 'self' https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://nominatim.openstreetmap.org`,
    `worker-src 'self' blob:`,
    `child-src 'self' blob:`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];

  return directives.join("; ");
}
