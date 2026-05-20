export default function InstructionBlock({ step }) {
  return (
    <div className="space-y-3">
      <h3 className="text-text-primary font-semibold text-sm">{step.title}</h3>
      <p className="text-text-muted text-sm leading-relaxed whitespace-pre-line">
        {step.body}
      </p>
    </div>
  )
}
