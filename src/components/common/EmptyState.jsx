export default function EmptyState({
  icon: Icon,
  title = "Nothing here yet",
  description,
  action,
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        {Icon ? <Icon size={26} /> : null}
      </span>
      <p className="empty-title">{title}</p>
      {description && <p className="empty-desc">{description}</p>}
      {action}
    </div>
  );
}
