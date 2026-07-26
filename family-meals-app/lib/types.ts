// ============================================================
// FAMILY MEALS — Tipos TypeScript
// ============================================================

export type HouseholdRole = 'owner' | 'editor' | 'viewer'
export type HealthCondition = 'ninguna' | 'erc' | 'adulto_mayor' | 'otra'
export type DietTexture = 'normal' | 'blanda' | 'triturada'
export type IngredientCategory =
  | 'proteina' | 'verdura' | 'fruta' | 'cereal' | 'lacteo' | 'grasa' | 'condimento' | 'otro'
export type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'refaccion'
export type SuitabilityStatus = 'apto' | 'precaucion' | 'evitar'
export type ProductPhotoType = 'empaque' | 'etiqueta_nutricional' | 'recibo'
export type ShoppingListStatus = 'borrador' | 'comprado'

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  refaccion: 'Refacción',
}

export const HEALTH_CONDITION_LABELS: Record<HealthCondition, string> = {
  ninguna: 'Ninguna',
  erc: 'Enfermedad renal crónica',
  adulto_mayor: 'Cuidado de adulto mayor',
  otra: 'Otra',
}

export const SUITABILITY_LABELS: Record<SuitabilityStatus, string> = {
  apto: 'Apto',
  precaucion: 'Con precaución',
  evitar: 'Evitar',
}

export const SUITABILITY_COLORS: Record<SuitabilityStatus, string> = {
  apto: '#10b981',
  precaucion: '#f59e0b',
  evitar: '#ef4444',
}

// ============================================================
// DB Row Types
// ============================================================

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Household {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface HouseholdAccess {
  id: string
  household_id: string
  user_id: string
  role: HouseholdRole
  invited_by: string | null
  invited_at: string
  accepted_at: string | null
}

export interface HouseholdMember {
  id: string
  household_id: string
  full_name: string
  birth_date: string | null
  relationship: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface HealthProfile {
  id: string
  member_id: string
  condition: HealthCondition
  ckd_stage: string | null
  sodium_mg_max: number | null
  potassium_mg_max: number | null
  phosphorus_mg_max: number | null
  protein_g_min: number | null
  protein_g_max: number | null
  fluid_ml_max: number | null
  texture: DietTexture
  doctor_name: string | null
  last_reviewed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  household_id: string
  name: string
  category: IngredientCategory
  unit_base: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface IngredientNutrition {
  ingredient_id: string
  calories: number | null
  protein_g: number | null
  sodium_mg: number | null
  potassium_mg: number | null
  phosphorus_mg: number | null
  carbs_g: number | null
  fat_g: number | null
  fluid_ml: number | null
  updated_at: string
}

export interface Product {
  id: string
  household_id: string
  ingredient_id: string
  brand: string
  package_size: number | null
  package_unit: string | null
  store: string | null
  price: number | null
  currency: string
  barcode: string | null
  sodium_mg_override: number | null
  potassium_mg_override: number | null
  phosphorus_mg_override: number | null
  protein_g_override: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProductPhoto {
  id: string
  product_id: string
  photo_url: string
  type: ProductPhotoType
  uploaded_at: string
}

export interface ProductPriceHistory {
  id: string
  product_id: string
  price: number
  store: string | null
  observed_at: string
}

export interface Recipe {
  id: string
  household_id: string
  name: string
  meal_type: MealType
  servings: number
  prep_time_min: number | null
  instructions: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id: string
  preferred_product_id: string | null
  quantity: number
  unit: string
  created_at: string
}

export interface RecipeNutritionCache {
  recipe_id: string
  calories: number | null
  protein_g: number | null
  sodium_mg: number | null
  potassium_mg: number | null
  phosphorus_mg: number | null
  cost_estimate: number | null
  calculated_at: string
}

export interface RecipeSuitability {
  id: string
  recipe_id: string
  member_id: string
  status: SuitabilityStatus
  reason: string | null
  calculated_at: string
}

export interface MealPlan {
  id: string
  household_id: string
  week_start_date: string
  budget_target: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MealPlanEntry {
  id: string
  plan_id: string
  date: string
  meal_type: MealType
  recipe_id: string
  servings_planned: number
  cooked: boolean
  created_at: string
}

export interface ShoppingList {
  id: string
  household_id: string
  plan_id: string | null
  status: ShoppingListStatus
  created_at: string
  updated_at: string
}

export interface ShoppingListItem {
  id: string
  list_id: string
  ingredient_id: string
  product_id: string | null
  quantity_total: number
  unit: string
  estimated_cost: number | null
  actual_cost: number | null
  purchased: boolean
  created_at: string
}

export interface Expense {
  id: string
  household_id: string
  shopping_list_id: string | null
  amount: number
  description: string | null
  spent_at: string
  created_at: string
}

// ============================================================
// Tipos enriquecidos (con joins)
// ============================================================

export interface RecipeWithSuitability extends Recipe {
  recipe_suitability?: RecipeSuitability[]
  recipe_nutrition_cache?: RecipeNutritionCache
}

export interface MealPlanEntryWithRecipe extends MealPlanEntry {
  recipe: Recipe
}

export interface HouseholdMemberWithHealth extends HouseholdMember {
  health_profile?: HealthProfile
}
