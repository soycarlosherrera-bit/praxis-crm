export default function BudgetPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Presupuesto</h1>
      <p className="text-slate-500 text-sm mb-8">
        Costo planeado por semana/mes vs. gasto real registrado.
      </p>
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
        Próximamente: comparación de presupuesto objetivo vs. gasto real.
      </div>
    </div>
  )
}
