// ============================================================
// PRAXIS CRM — Tipos TypeScript
// ============================================================

export type PraxisDimension = 'trabajo' | 'recreacion' | 'espiritu' | 'educacion' | 'salud'
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'
export type TaskStatus = 'pending' | 'in_progress' | 'done'
export type ContactStatus = 'lead' | 'active' | 'pending' | 'inactive'
export type MemberRole = 'editor' | 'viewer'
export type Priority = 'low' | 'medium' | 'high'

export const PRAXIS_LABELS: Record<PraxisDimension, string> = {
  trabajo:    'Trabajo',
  recreacion: 'Recreación',
  espiritu:   'Espíritu',
  educacion:  'Educación',
  salud:      'Salud',
}

export const PRAXIS_COLORS: Record<PraxisDimension, string> = {
  trabajo:    '#6366f1',  // indigo
  recreacion: '#f59e0b',  // amber
  espiritu:   '#8b5cf6',  // violet
  educacion:  '#10b981',  // emerald
  salud:      '#ef4444',  // red
}

export const PRAXIS_ICONS: Record<PraxisDimension, string> = {
  trabajo:    '💼',
  recreacion: '🎮',
  espiritu:   '✨',
  educacion:  '📚',
  salud:      '❤️',
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  active:    'Activo',
  paused:    'Pausado',
  completed: 'Completado',
  archived:  'Archivado',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending:     'Pendiente',
  in_progress: 'En progreso',
  done:        'Hecho',
}

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  lead:     'Lead',
  active:   'Activo',
  pending:  'Pendiente',
  inactive: 'Inactivo',
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

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  color: string
  icon: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface PraxisScore {
  id: string
  project_id: string
  dimension: PraxisDimension
  score: number
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: MemberRole
  invited_by: string | null
  invited_at: string
  accepted_at: string | null
}

export interface Contact {
  id: string
  owner_id: string
  full_name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  notes: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ProjectContact {
  id: string
  project_id: string
  contact_id: string
  status: ContactStatus
  follow_up_date: string | null
  notes: string | null
  added_by: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  due_date: string | null
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Observation {
  id: string
  project_id: string
  content: string
  is_edited: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// ============================================================
// Tipos enriquecidos (con joins)
// ============================================================

export interface ProjectWithScores extends Project {
  praxis_scores: PraxisScore[]
  owner: Profile
}

export interface TaskWithAssignee extends Task {
  assignee?: Profile
  creator?: Profile
}

export interface ObservationWithAuthor extends Observation {
  author: Profile
}

export interface ProjectContactWithContact extends ProjectContact {
  contact: Contact
}

export interface ProjectMemberWithProfile extends ProjectMember {
  profile: Profile
}
