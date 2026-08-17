import { useEffect, useId, useRef, useState } from 'react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useApplications, useApplicationsActions } from '../state/ApplicationsContext'

/** Search-as-you-type. The field owns the text so typing stays responsive, and
 * only the settled value is pushed into the shared filters. */
export function SearchInput() {
  const { filters, filtersToken } = useApplications()
  const { patchFilters } = useApplicationsActions()
  const inputId = useId()

  const [text, setText] = useState(filters.query)
  const debouncedText = useDebouncedValue(text, 250)
  const inputRef = useRef<HTMLInputElement>(null)
  /** The last query this field and the shared filters agreed on. It tells the
   * two effects below which side moved, so a settled keystroke never overwrites
   * an external reset and vice versa. */
  const syncedQueryRef = useRef(filters.query)

  useEffect(() => {
    if (debouncedText === syncedQueryRef.current) return

    syncedQueryRef.current = debouncedText
    patchFilters({ query: debouncedText })
  }, [debouncedText, patchFilters])

  // Keeps the field in step when the query is changed elsewhere. A reset also
  // has to win when the query is already empty — the field can still be holding
  // text that has not settled yet — which is what the token distinguishes.
  const lastTokenRef = useRef(filtersToken)
  useEffect(() => {
    const wasReset = filtersToken !== lastTokenRef.current
    lastTokenRef.current = filtersToken

    if (!wasReset && filters.query === syncedQueryRef.current) return

    syncedQueryRef.current = filters.query
    setText(filters.query)
  }, [filtersToken, filters.query])

  // "/" jumps to search from anywhere on the page, but only when the reader is
  // not already typing somewhere — otherwise it would swallow the character.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target as HTMLElement | null
      if (
        target?.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }

      event.preventDefault()
      inputRef.current?.focus()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div className="field search-field">
      <label className="field__label" htmlFor={inputId}>
        Search
      </label>

      <div className="search-field__control">
        <input
          ref={inputRef}
          id={inputId}
          className="input"
          type="search"
          value={text}
          placeholder="Company, role, tag, note…"
          aria-describedby={`${inputId}-hint`}
          onChange={(event) => setText(event.target.value)}
        />

        {text ? (
          <button
            type="button"
            className="search-field__clear"
            onClick={() => setText('')}
          >
            <span aria-hidden="true">×</span>
            <span className="visually-hidden">Clear search</span>
          </button>
        ) : null}
      </div>

      <p className="field__hint" id={`${inputId}-hint`}>
        Press <kbd>/</kbd> to jump here
      </p>
    </div>
  )
}
