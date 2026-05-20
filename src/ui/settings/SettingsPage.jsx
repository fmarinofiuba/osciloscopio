import { useState } from 'react'

const LANGUAGES = ['Español', 'English', 'Português']
const THEMES    = ['Dark', 'Dark Blue', 'OLED']
const QUALITY   = ['Alta', 'Media', 'Baja']

function SettingRow({ label, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-panel-border last:border-0">
      <span className="text-text-muted text-sm">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function SelectPill({ options, value, onChange }) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`
            px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150
            ${value === opt
              ? 'bg-accent text-white'
              : 'bg-white/6 text-text-muted hover:bg-white/12 hover:text-text-primary border border-panel-border'
            }
          `}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function SliderRow({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className="py-3 border-b border-panel-border last:border-0 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-text-muted text-sm">{label}</span>
        <span className="text-text-primary text-xs font-mono">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500 h-1"
      />
    </div>
  )
}

export default function SettingsPage() {
  const [language, setLanguage]   = useState('Español')
  const [theme, setTheme]         = useState('Dark')
  const [quality, setQuality]     = useState('Alta')
  const [volume, setVolume]       = useState(60)
  const [dragSens, setDragSens]   = useState(5)
  const [uiScale, setUiScale]     = useState(100)

  function resetAll() {
    setLanguage('Español')
    setTheme('Dark')
    setQuality('Alta')
    setVolume(60)
    setDragSens(5)
    setUiScale(100)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-3 border-b border-panel-border">
        <h2 className="text-text-primary text-sm font-semibold">Configuración</h2>
        <p className="text-text-muted text-xs mt-0.5">Parámetros generales de la aplicación</p>
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll px-4 py-2">

        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-2 mb-1">Interfaz</p>
        <SettingRow label="Idioma">
          <SelectPill options={LANGUAGES} value={language} onChange={setLanguage} />
        </SettingRow>
        <SettingRow label="Tema visual">
          <SelectPill options={THEMES} value={theme} onChange={setTheme} />
        </SettingRow>

        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-4 mb-1">Gráficos</p>
        <SettingRow label="Calidad gráfica">
          <SelectPill options={QUALITY} value={quality} onChange={setQuality} />
        </SettingRow>

        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-4 mb-1">Interacción</p>
        <SliderRow
          label="Sensibilidad de drag"
          value={dragSens}
          min={1}
          max={10}
          step={1}
          unit=""
          onChange={setDragSens}
        />
        <SliderRow
          label="Escala UI"
          value={uiScale}
          min={75}
          max={150}
          step={5}
          unit="%"
          onChange={setUiScale}
        />

        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-4 mb-1">Audio</p>
        <SliderRow
          label="Volumen"
          value={volume}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={setVolume}
        />

        <div className="mt-6 pb-4">
          <button
            onClick={resetAll}
            className="
              w-full py-2 rounded-lg text-sm font-medium
              border border-panel-border text-text-muted
              hover:text-text-primary hover:bg-white/8 hover:border-white/20
              transition-all duration-150 active:scale-95
            "
          >
            Restaurar configuración predeterminada
          </button>
        </div>
      </div>
    </div>
  )
}
