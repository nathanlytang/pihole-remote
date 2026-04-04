/**
 * Derives a host permission origin pattern from a Pi-hole address.
 * e.g. "http://192.168.1.2" -> "http://192.168.1.2/*"
 *      "https://pi.hole:8080/admin" -> "https://pi.hole:8080/*"
 */
export function originPattern(address: string): string {
  try {
    const url = new URL(address.replace(/\/+$/, ''));
    return `${url.origin}/*`;
  } catch {
    // If the address isn't a valid URL, return it with a wildcard
    const base = address.replace(/\/+$/, '');
    return `${base}/*`;
  }
}

/**
 * Requests host permission for a given Pi-hole address.
 * Returns true if granted, false if denied.
 */
export async function requestHostPermission(address: string): Promise<boolean> {
  const pattern = originPattern(address);
  try {
    return await browser.permissions.request({ origins: [pattern] });
  } catch {
    return false;
  }
}

/**
 * Checks whether host permission is already granted for a Pi-hole address.
 */
export async function hasHostPermission(address: string): Promise<boolean> {
  const pattern = originPattern(address);
  try {
    return await browser.permissions.contains({ origins: [pattern] });
  } catch {
    return false;
  }
}
