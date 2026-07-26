import type { SupabaseClient } from '@supabase/supabase-js'
import type { HealthProfile, SuitabilityStatus } from './types'

const MASS_TO_GRAMS: Record<string, number> = { g: 1, kg: 1000 }
const VOLUME_TO_ML: Record<string, number> = { ml: 1, l: 1000, lt: 1000, litro: 1000 }

/** Convierte una cantidad entre unidades de masa o de volumen. Devuelve null si no son compatibles. */
function convertToBase(quantity: number, fromUnit: string, toUnit: string): number | null {
  const from = fromUnit.trim().toLowerCase()
  const to = toUnit.trim().toLowerCase()
  if (from === to) return quantity
  if (from in MASS_TO_GRAMS && to in MASS_TO_GRAMS) {
    return (quantity * MASS_TO_GRAMS[from]) / MASS_TO_GRAMS[to]
  }
  if (from in VOLUME_TO_ML && to in VOLUME_TO_ML) {
    return (quantity * VOLUME_TO_ML[from]) / VOLUME_TO_ML[to]
  }
  return null
}

interface PerServingNutrition {
  recipe_id: string
  calories: number
  protein_g: number
  sodium_mg: number
  potassium_mg: number
  phosphorus_mg: number
  cost_estimate: number | null
  calculated_at: string
}

/**
 * Recalcula recipe_nutrition_cache (por porción) sumando recipe_ingredients × ingredient_nutrition
 * (con overrides de producto cuando aplica), y recipe_suitability por cada miembro con perfil de salud.
 * Asume que recipe_ingredients.unit siempre coincide con ingredients.unit_base (se fuerza al guardar
 * la receta), así que no hace falta convertir unidades para la nutrición — solo para el costo, cuando
 * el empaque del producto está en una unidad distinta (ej. "L" vs "ml").
 */
export async function recalculateRecipe(
  supabase: SupabaseClient,
  recipeId: string,
  householdId: string
) {
  const { data: recipe } = await supabase
    .from('recipes')
    .select('servings')
    .eq('id', recipeId)
    .single()
  const servings = recipe?.servings && recipe.servings > 0 ? recipe.servings : 1

  const { data: riRows } = await supabase
    .from('recipe_ingredients')
    .select('quantity, ingredient_id, preferred_product_id')
    .eq('recipe_id', recipeId)

  const rows = riRows ?? []
  const ingredientIds = [...new Set(rows.map((r: any) => r.ingredient_id))]
  const productIds = rows.map((r: any) => r.preferred_product_id).filter(Boolean) as string[]

  const { data: ingredientRows } = ingredientIds.length
    ? await supabase.from('ingredients').select('id, unit_base').in('id', ingredientIds)
    : { data: [] }
  const ingredientMap = new Map((ingredientRows ?? []).map((i: any) => [i.id, i]))

  const { data: nutritionRows } = ingredientIds.length
    ? await supabase.from('ingredient_nutrition').select('*').in('ingredient_id', ingredientIds)
    : { data: [] }
  const nutritionMap = new Map((nutritionRows ?? []).map((n: any) => [n.ingredient_id, n]))

  const { data: productRows } = productIds.length
    ? await supabase.from('products').select('*').in('id', productIds)
    : { data: [] }
  const productMap = new Map((productRows ?? []).map((p: any) => [p.id, p]))

  let calories = 0, protein_g = 0, sodium_mg = 0, potassium_mg = 0, phosphorus_mg = 0, cost_estimate = 0

  for (const row of rows as any[]) {
    const ingredient = ingredientMap.get(row.ingredient_id) as any
    const nutrition = nutritionMap.get(row.ingredient_id) as any
    const product = row.preferred_product_id ? (productMap.get(row.preferred_product_id) as any) : null

    // La cantidad ya está expresada en la unidad base del ingrediente.
    const factor = row.quantity / 100

    if (nutrition) {
      calories += (nutrition.calories ?? 0) * factor
      protein_g += (product?.protein_g_override ?? nutrition.protein_g ?? 0) * factor
      sodium_mg += (product?.sodium_mg_override ?? nutrition.sodium_mg ?? 0) * factor
      potassium_mg += (product?.potassium_mg_override ?? nutrition.potassium_mg ?? 0) * factor
      phosphorus_mg += (product?.phosphorus_mg_override ?? nutrition.phosphorus_mg ?? 0) * factor
    }

    if (product?.price != null && product.package_size && ingredient) {
      const packageInBase = convertToBase(product.package_size, product.package_unit ?? ingredient.unit_base, ingredient.unit_base)
      if (packageInBase && packageInBase > 0) {
        cost_estimate += (product.price / packageInBase) * row.quantity
      }
    }
  }

  const perServing: PerServingNutrition = {
    recipe_id: recipeId,
    calories: calories / servings,
    protein_g: protein_g / servings,
    sodium_mg: sodium_mg / servings,
    potassium_mg: potassium_mg / servings,
    phosphorus_mg: phosphorus_mg / servings,
    cost_estimate: cost_estimate > 0 ? cost_estimate / servings : null,
    calculated_at: new Date().toISOString(),
  }

  await supabase.from('recipe_nutrition_cache').upsert(perServing, { onConflict: 'recipe_id' })
  await calculateSuitability(supabase, recipeId, householdId, perServing)

  return perServing
}

async function calculateSuitability(
  supabase: SupabaseClient,
  recipeId: string,
  householdId: string,
  nutrition: Pick<PerServingNutrition, 'sodium_mg' | 'potassium_mg' | 'phosphorus_mg' | 'protein_g'>
) {
  const { data: members } = await supabase
    .from('household_members')
    .select('id, health_profiles(*)')
    .eq('household_id', householdId)

  for (const member of (members ?? []) as { id: string; health_profiles: HealthProfile[] }[]) {
    const profile = member.health_profiles?.[0]

    if (!profile) {
      await supabase.from('recipe_suitability').delete().eq('recipe_id', recipeId).eq('member_id', member.id)
      continue
    }

    let status: SuitabilityStatus = 'apto'
    const reasons: string[] = []

    function checkMax(value: number, max: number | null, label: string, unit: string) {
      if (max == null) return
      if (value > max) {
        status = 'evitar'
        reasons.push(`${label} ${Math.round(value)}${unit} supera el máximo de ${max}${unit}`)
      } else if (value > max * 0.8) {
        if (status === 'apto') status = 'precaucion'
        reasons.push(`${label} ${Math.round(value)}${unit} cerca del máximo de ${max}${unit}`)
      }
    }

    checkMax(nutrition.sodium_mg, profile.sodium_mg_max, 'Sodio', 'mg')
    checkMax(nutrition.potassium_mg, profile.potassium_mg_max, 'Potasio', 'mg')
    checkMax(nutrition.phosphorus_mg, profile.phosphorus_mg_max, 'Fósforo', 'mg')
    if (profile.protein_g_max != null) checkMax(nutrition.protein_g, profile.protein_g_max, 'Proteína', 'g')
    if (profile.protein_g_min != null && nutrition.protein_g < profile.protein_g_min) {
      if (status === 'apto') status = 'precaucion'
      reasons.push(`Proteína ${Math.round(nutrition.protein_g)}g por debajo del mínimo de ${profile.protein_g_min}g`)
    }

    await supabase.from('recipe_suitability').upsert(
      {
        recipe_id: recipeId,
        member_id: member.id,
        status,
        reason: reasons.length ? reasons.join('; ') : null,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: 'recipe_id,member_id' }
    )
  }
}
