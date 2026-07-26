import type { HealthCondition, DietTexture, HealthProfile } from '@/lib/types'

export interface HealthFormState {
  condition: HealthCondition
  ckd_stage: string
  sodium_mg_max: string
  potassium_mg_max: string
  phosphorus_mg_max: string
  protein_g_min: string
  protein_g_max: string
  fluid_ml_max: string
  texture: DietTexture
  doctor_name: string
  last_reviewed_at: string
  notes: string
}

export const EMPTY_HEALTH_FORM: HealthFormState = {
  condition: 'ninguna',
  ckd_stage: '',
  sodium_mg_max: '',
  potassium_mg_max: '',
  phosphorus_mg_max: '',
  protein_g_min: '',
  protein_g_max: '',
  fluid_ml_max: '',
  texture: 'normal',
  doctor_name: '',
  last_reviewed_at: '',
  notes: '',
}

export function healthProfileToForm(profile: HealthProfile): HealthFormState {
  return {
    condition: profile.condition,
    ckd_stage: profile.ckd_stage ?? '',
    sodium_mg_max: profile.sodium_mg_max?.toString() ?? '',
    potassium_mg_max: profile.potassium_mg_max?.toString() ?? '',
    phosphorus_mg_max: profile.phosphorus_mg_max?.toString() ?? '',
    protein_g_min: profile.protein_g_min?.toString() ?? '',
    protein_g_max: profile.protein_g_max?.toString() ?? '',
    fluid_ml_max: profile.fluid_ml_max?.toString() ?? '',
    texture: profile.texture,
    doctor_name: profile.doctor_name ?? '',
    last_reviewed_at: profile.last_reviewed_at ?? '',
    notes: profile.notes ?? '',
  }
}

function toNumberOrNull(v: string): number | null {
  return v.trim() === '' ? null : Number(v)
}

export function healthFormToPayload(memberId: string, form: HealthFormState) {
  return {
    member_id: memberId,
    condition: form.condition,
    ckd_stage: form.ckd_stage || null,
    sodium_mg_max: toNumberOrNull(form.sodium_mg_max),
    potassium_mg_max: toNumberOrNull(form.potassium_mg_max),
    phosphorus_mg_max: toNumberOrNull(form.phosphorus_mg_max),
    protein_g_min: toNumberOrNull(form.protein_g_min),
    protein_g_max: toNumberOrNull(form.protein_g_max),
    fluid_ml_max: toNumberOrNull(form.fluid_ml_max),
    texture: form.texture,
    doctor_name: form.doctor_name || null,
    last_reviewed_at: form.last_reviewed_at || null,
    notes: form.notes || null,
  }
}
