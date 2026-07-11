interface ScoreCardProps {
  overallScore: number
  averageConfidence: number
  speechRateWpm: number
  pauseConsistency: number
  fillerWordRatio: number
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Fair'
  return 'Needs improvement'
}

function barWidth(score: number): string {
  return `${Math.round(score)}%`
}

export default function ScoreCard({
  overallScore,
  averageConfidence,
  speechRateWpm,
  pauseConsistency,
  fillerWordRatio,
}: ScoreCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-6 text-center">
        <p className={`text-5xl font-bold ${scoreColor(overallScore)}`}>
          {Math.round(overallScore)}
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          {scoreLabel(overallScore)}
        </p>
      </div>

      <div className="space-y-3">
        <MetricBar
          label="Recognition confidence"
          value={Math.round(averageConfidence * 100)}
        />
        <MetricBar
          label="Speech rate"
          value={Math.min(Math.round((speechRateWpm / 170) * 100), 100)}
          detail={`${Math.round(speechRateWpm)} WPM`}
        />
        <MetricBar
          label="Pause consistency"
          value={Math.round(pauseConsistency * 100)}
        />
        <MetricBar
          label="Filler words"
          value={Math.round((1 - fillerWordRatio) * 100)}
          detail={`${(fillerWordRatio * 100).toFixed(1)}% fillers`}
        />
      </div>
    </div>
  )
}

function MetricBar({
  label,
  value,
  detail,
}: {
  label: string
  value: number
  detail?: string
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        {detail && <span>{detail}</span>}
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-100">
        <div
          className="h-2 rounded-full bg-zinc-900 transition-all"
          style={{ width: barWidth(value) }}
        />
      </div>
    </div>
  )
}
