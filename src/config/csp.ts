export function generateCSP(nonce: string): string {
  const directives = [
    `default-src 'self'`,
    // Cesium needs eval + WebAssembly to initialize the globe.
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' 'wasm-unsafe-eval' blob:`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org`,
    `font-src 'self'`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://nominatim.openstreetmap.org`,
    `worker-src 'self' blob:`,
    `child-src 'self' blob:`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];

  return directives.join("; ");
}
