// Brand spellings already used by this project and its GitHub repository.
// Do not allow arbitrary databases, suffix collisions or non-Turso services.
export function isApprovedKikaHost(hostname) {
  return hostname.endsWith('.turso.io') &&
    /^(delicias-da-kika|deliciasdakika|delicidasdakika)(-|\.)/.test(hostname);
}
