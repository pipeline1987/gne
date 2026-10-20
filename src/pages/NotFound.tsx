import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <p className="empty">
      That address is an alley. Try the <Link to="/">late city run</Link> or the{' '}
      <Link to="/archive">archive</Link>.
    </p>
  )
}
