import type { IngredientNutrition } from '@/lib/types'

export interface NutritionFormState {
  calories: string
  protein_g: string
  sodium_mg: string
  potassium_mg: string
  phosphorus_mg: string
  carbs_g: string
  fat_g: string
  fluid_ml: string
}

export const EMPTY_NUTRITION_FORM: NutritionFormState = {
  calories: '',
  protein_g: '',
  sodium_mg: '',
  potassium_mg: '',
  phosphorus_mg: '',
  carbs_g: '',
  fat_g: '',
  fluid_ml: '',
}

export function nutritionToForm(n: IngredientNutrition): NutritionFormState {
  return {
    calories: n.calories?.toString() ?? '',
    protein_g: n.protein_g?.toString() ?? '',
    sodium_mg: n.sodium_mg?.toString() ?? '',
    potassium_mg: n.potassium_mg?.toString() ?? '',
    phosphorus_mg: n.phosphorus_mg?.toString() ?? '',
    carbs_g: n.carbs_g?.toString() ?? '',
    fat_g: n.fat_g?.toString() ?? '',
    fluid_ml: n.fluid_ml?.toString() ?? '',
  }
}

function toNumberOrNull(v: string): number | null {
  return v.trim() === '' ? null : Number(v)
}

export function nutritionFormToPayload(ingredientId: string, form: NutritionFormState) {
  return {
    ingredient_id: ingredientId,
    calories: toNumberOrNull(form.calories),
    protein_g: toNumberOrNull(form.protein_g),
    sodium_mg: toNumberOrNull(form.sodium_mg),
    potassium_mg: toNumberOrNull(form.potassium_mg),
    phosphorus_mg: toNumberOrNull(form.phosphorus_mg),
    carbs_g: toNumberOrNull(form.carbs_g),
    fat_g: toNumberOrNull(form.fat_g),
    fluid_ml: toNumberOrNull(form.fluid_ml),
  }
}
