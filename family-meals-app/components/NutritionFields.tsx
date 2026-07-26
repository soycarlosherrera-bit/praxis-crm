import type { NutritionFormState } from '@/lib/ingredient-form'

interface Props {
  value: NutritionFormState
  onChange: (value: NutritionFormState) => void
  unitBase: string
}

export default function NutritionFields({ value, onChange, unitBase }: Props) {
  function set<K extends keyof NutritionFormState>(key: K, v: NutritionFormState[K]) {
    onChange({ ...value, [key]: v })
  }

  const fields: { key: keyof NutritionFormState; label: string }[] = [
    { key: 'calories', label: 'Calorías' },
    { key: 'protein_g', label: 'Proteína (g)' },
    { key: 'sodium_mg', label: 'Sodio (mg)' },
    { key: 'potassium_mg', label: 'Potasio (mg)' },
    { key: 'phosphorus_mg', label: 'Fósforo (mg)' },
    { key: 'carbs_g', label: 'Carbohidratos (g)' },
    { key: 'fat_g', label: 'Grasa (g)' },
    { key: 'fluid_ml', label: 'Líquido (ml)' },
  ]

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">
        Por cada 100 {unitBase || 'unidad_base'}. Deja en blanco lo que no apliquen o no conozcas.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
            <input
              type="number"
              step="any"
              value={value[f.key]}
              onChange={e => set(f.key, e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
