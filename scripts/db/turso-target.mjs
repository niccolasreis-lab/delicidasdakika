// Verified using Vercel store_ZMvpHwXEd11DUyxM: owned by the intended team,
// newly provisioned, ready, and connected only to the Kika project.
// Bind to that resource's name/ID, never to arbitrary Turso or brand-name hosts.
const resourceStems = [
  'database-bisque-cushion',
  '01a18a7d-cd01-7479-b1a8-b1d3b8e180ca',
];
export function isApprovedKikaHost(hostname) {
  return hostname.endsWith('.turso.io') &&
    resourceStems.some(stem => hostname.startsWith(`${stem}-`) || hostname === `${stem}.turso.io`);
}
