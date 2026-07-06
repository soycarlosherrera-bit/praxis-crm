'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PRAXIS_LABELS, PRAXIS_COLORS, PRAXIS_ICONS } from '@/lib/types'
import type { PraxisScore, PraxisDimension } from '@/lib/types'

interface Props {
  projectId: string
  scores: PraxisScore[]
  canEdit?: boolean | null
}

export default function PraxisSliders({ projectId, scores, canEdit }: Props) {
  const supabase = createClient()
  const [localScores, setLocalScores] = useState<Record<string, number>>(
    Object.fromEntries(scores.map(s => [s.dimension, s.score]))
  )
  const [saving, setSaving] = useState<string | null>(null)

  async function handleChange(dimension: PraxisDimension, value: number) {
    setLocalScores(prev => ({ ...prev, [dimension]: value }))
  }

  async function handleSave(dimension: PraxisDimension) {
    setSaving(dimension)
    await supabase
      .from('praxis_scores')
      .update({ score: localScores[dimension] })
      .eq('project_id', projectId)
      .eq('dimension', dimension)
    setSaving(null)
  }

  const dims = Object.keys(PRAXIS_LABELS) as PraxisDimension[]

  return (
    <div className="space-y-4">
      {dims.map(dim => {
        const score = localScores[dim] ?? 0
        const color = PRAXIS_COLORS[dim]
        return (
          <div key={dim}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{PRAXIS_ICONS[dim]}</span>
                <span className="text-sm font-medium text-slate-700">{PRAXIS_LABELS[dim]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color }}>{score}%</span>
                {canEdit && saving === dim && (
                  <span className="text-xs text-slate-400">Guardando...</span>
                )}
              </div>
            </div>
            {canEdit ? (
              <input
                type="range"
                min={0}
                max={100}
                value={score}
                onChange={e => handleChange(dim, Number(e.target.value))}
                onMouseUp={() => handleSave(dim)}
                onTouchEnd={() => handleSave(dim)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: color,
                  background: `linear-gradient(to right, ${color} ${score}%, #e2e8f0 ${score}%)`,
                }}
              />
            ) : (
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${score}%`, backgroundColor: color }}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Promedio total */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Promedio PRAXIS</span>
          <span className="text-sm font-bold text-slate-700">
            {Math.round(Object.values(localScores).reduce((a, b) => a + b, 0) / 5)}%
          </span>
        </div>
      </div>
    </div>
  )
}
