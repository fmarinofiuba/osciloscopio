import { useAppState } from '../../state/AppContext.jsx'
import CompactLauncher from './CompactLauncher.jsx'
import PanelHeader from './PanelHeader.jsx'
import PanelContent from './PanelContent.jsx'
import PanelFooter from './PanelFooter.jsx'

export default function WorkspacePanel() {
  const { state } = useAppState()
  const { panelState } = state

  if (panelState === 'hidden') {
    return null
  }

  if (panelState === 'compact') {
    return <CompactLauncher />
  }

  // panelState === 'expanded'
  return (
    <>
      {/* Compact launcher still visible as a back affordance when expanded */}
      {/* The panel itself */}
      <div
        className="
          pointer-events-auto
          flex flex-col
          w-[340px] max-w-[35vw] min-w-[280px]
          h-full
          glass-panel
          border-l border-panel-border
          animate-slide-in-right
          flex-shrink-0
        "
      >
        <PanelHeader />
        <PanelContent />
        <PanelFooter />
      </div>
    </>
  )
}
