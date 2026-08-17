let fallbackCounter = 0

/** Stable id generator. Uses `crypto.randomUUID` when the environment offers
 * it and degrades to a counter-based id so the app still works in older
 * browsers and in non-secure contexts. */
export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }

  fallbackCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${fallbackCounter.toString(36)}`
}
