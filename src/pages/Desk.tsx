import { DeskChat } from '../components/DeskChat'

export function Desk() {
  return (
    <div className="desk-page">
      <div className="archive-head">
        <div>
          <div className="kicker">The night clerk</div>
          <h1>Ask the desk</h1>
          <p className="lede">
            An agent on the late city run. It searches the morgue, reads the piece, and answers
            only from copy this paper printed. Follow-ups stay on the spike.
          </p>
        </div>
        <div className="count">No wire · no rumor · basement only</div>
      </div>
      <DeskChat />
    </div>
  )
}
