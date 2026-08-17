import { useApplications } from '../state/ApplicationsContext'

export function ListPage() {
  const { items, status } = useApplications()

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Applications</h1>
          <p className="page-header__subtitle">
            {status === 'ready'
              ? `${items.length} tracked`
              : 'Loading your pipeline…'}
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="panel__body">
          <ul>
            {items.map((application) => (
              <li key={application.id}>
                {application.company} — {application.role}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
