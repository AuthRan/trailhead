import { useEffect } from 'react'

export const BASE_TITLE = 'Trailhead'

/** Names the current view in the browser tab and history. Restores whatever
 * title was there before, so a view that unmounts does not leave its own name
 * behind. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE

    return () => {
      document.title = previous
    }
  }, [title])
}
