import { useEffect, useId, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DeskChat } from './DeskChat'

export function DeskDrawer() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const onDeskPage = location.pathname === '/desk'

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  if (onDeskPage) return null

  return (
    <>
      <button
        type="button"
        className="desk-launch"
        aria-expanded={open}
        aria-controls="night-desk-drawer"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Close the desk' : 'Ask the desk'}
      </button>
      {open && (
        <aside
          id="night-desk-drawer"
          className="desk-drawer"
          aria-labelledby={titleId}
        >
          <header className="desk-drawer-head">
            <div>
              <div className="kicker">Tip line</div>
              <h2 id={titleId}>Night desk</h2>
            </div>
            <button type="button" className="chip" onClick={() => setOpen(false)}>
              Hang up
            </button>
          </header>
          <DeskChat compact />
        </aside>
      )}
    </>
  )
}
