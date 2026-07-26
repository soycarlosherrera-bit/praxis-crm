export interface RecipeIngredientRow {
  ingredient_id: string
  quantity: string
  preferred_product_id: string
}

export interface IngredientOption {
  id: string
  name: string
  unit_base: string
}

export interface ProductOption {
  id: string
  ingredient_id: string
  brand: string
}

interface Props {
  ingredients: IngredientOption[]
  products: ProductOption[]
  rows: RecipeIngredientRow[]
  onChange: (rows: RecipeIngredientRow[]) => void
}

export default function RecipeIngredientsEditor({ ingredients, products, rows, onChange }: Props) {
  function updateRow(index: number, patch: Partial<RecipeIngredientRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function addRow() {
    onChange([...rows, { ingredient_id: ingredients[0]?.id ?? '', quantity: '', preferred_product_id: '' }])
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index))
  }

  if (ingredients.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Primero necesitas crear al menos un ingrediente en el{' '}
        <a href="/dashboard/recipes/ingredients/new" className="text-emerald-600 hover:underline">catálogo</a>.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const ingredient = ingredients.find(i => i.id === row.ingredient_id)
        const rowProducts = products.filter(p => p.ingredient_id === row.ingredient_id)
        return (
          <div key={index} className="flex items-start gap-2">
            <select
              value={row.ingredient_id}
              onChange={e => updateRow(index, { ingredient_id: e.target.value, preferred_product_id: '' })}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {ingredients.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 w-32">
              <input
                type="number"
                step="any"
                value={row.quantity}
                onChange={e => updateRow(index, { quantity: e.target.value })}
                placeholder="Cant."
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400 flex-shrink-0">{ingredient?.unit_base}</span>
            </div>
            <select
              value={row.preferred_product_id}
              onChange={e => updateRow(index, { preferred_product_id: e.target.value })}
              className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Sin marca preferida</option>
              {rowProducts.map(p => (
                <option key={p.id} value={p.id}>{p.brand}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none px-2 py-2"
            >
              ×
            </button>
          </div>
        )
      })}
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-emerald-600 hover:underline"
      >
        + Agregar ingrediente
      </button>
    </div>
  )
}
