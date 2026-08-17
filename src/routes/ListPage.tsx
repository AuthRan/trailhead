import { FilterBar } from '../components/FilterBar'
import { StageBadge } from '../components/StageBadge'
import { useApplications } from '../state/ApplicationsContext'

export function ListPage() {
  const { items, totalCount } = useApplications()

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Applications</h1>
          <p className="page-header__subtitle">{totalCount} tracked</p>
        </div>
      </div>

      <FilterBar />

      <section className="panel">
        <div className="panel__body">
          <ul>
            {items.map((application) => (
              <li key={application.id}>
                <StageBadge stage={application.stage} /> {application.company} —{' '}
                {application.role}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
