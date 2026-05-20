import { useState } from 'react'
import manualData from '../../data/manual.json'
import ManualSection from '../manual/ManualSection.jsx'

export default function ManualMode() {
  const [activeSection, setActiveSection] = useState(null)

  if (activeSection) {
    const section = manualData.find((s) => s.id === activeSection)
    return <ManualSection section={section} onBack={() => setActiveSection(null)} />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-3 border-b border-panel-border">
        <h2 className="text-text-primary text-sm font-semibold">Manual del osciloscopio</h2>
        <p className="text-text-muted text-xs mt-0.5">Teoría y referencia técnica</p>
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll px-3 py-3 space-y-1.5">
        {manualData.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className="
              w-full text-left px-3 py-3 rounded-xl border border-panel-border
              bg-white/3 hover:bg-white/7 hover:border-white/15
              transition-all duration-150 active:scale-[0.98]
              flex items-center gap-3 group
            "
          >
            <span className="text-xl group-hover:scale-110 transition-transform">
              {section.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm font-medium">{section.title}</p>
              <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{section.summary}</p>
            </div>
            <span className="text-text-muted text-sm group-hover:text-accent transition-colors">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
