import { Button } from './Button'

export function EmptyState({
  actionLabel,
  children,
  onAction,
  title = 'Nothing to show',
}) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
