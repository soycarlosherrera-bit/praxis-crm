import type { HealthFormState } from '@/lib/health-form'

interface Props {
  value: HealthFormState
  onChange: (value: HealthFormState) => void
}

export default function HealthProfileFields({ value, onChange }: Props) {
  function set<K extends keyof HealthFormState>(key: K, v: HealthFormState[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Condición</label>
        <select
          value={value.condition}
          onChange={e => set('condition', e.target.value as HealthFormState['condition'])}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ninguna">Ninguna</option>
          <option value="erc">Enfermedad renal crónica (ERC)</option>
          <option value="adulto_mayor">Cuidado de adulto mayor</option>
          <option value="otra">Otra</option>
        </select>
      </div>

      {value.condition === 'erc' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Etapa de ERC</label>
          <input
            type="text"
            value={value.ckd_stage}
            onChange={e => set('ckd_stage', e.target.value)}
            placeholder="ej. 3b, 5-diálisis"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-slate-700 mb-1">Límites diarios (según indicación médica)</p>
        <p className="text-xs text-slate-400 mb-2">Deja en blanco lo que no aplique.</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Sodio máx. (mg)</label>
            <input
              type="number"
              value={value.sodium_mg_max}
              onChange={e => set('sodium_mg_max', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Potasio máx. (mg)</label>
            <input
              type="number"
              value={value.potassium_mg_max}
              onChange={e => set('potassium_mg_max', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fósforo máx. (mg)</label>
            <input
              type="number"
              value={value.phosphorus_mg_max}
              onChange={e => set('phosphorus_mg_max', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Proteína mín. (g)</label>
          <input
            type="number"
            value={value.protein_g_min}
            onChange={e => set('protein_g_min', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Proteína máx. (g)</label>
          <input
            type="number"
            value={value.protein_g_max}
            onChange={e => set('protein_g_max', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Líquidos máx. (ml)</label>
          <input
            type="number"
            value={value.fluid_ml_max}
            onChange={e => set('fluid_ml_max', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Textura de los alimentos</label>
        <select
          value={value.texture}
          onChange={e => set('texture', e.target.value as HealthFormState['texture'])}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="normal">Normal</option>
          <option value="blanda">Blanda</option>
          <option value="triturada">Triturada</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Médico / nutriólogo</label>
          <input
            type="text"
            value={value.doctor_name}
            onChange={e => set('doctor_name', e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Última revisión</label>
          <input
            type="date"
            value={value.last_reviewed_at}
            onChange={e => set('last_reviewed_at', e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas de salud</label>
        <textarea
          value={value.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>
    </div>
  )
}
