import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="panel">
      <div className="panel__body empty-state">
        <h1 className="empty-state__title">That page does not exist</h1>
        <p>The view you asked for is not part of Trailhead.</p>
        <Link className="button" to="/">
          Back to applications
        </Link>
      </div>
    </section>
  )
}
