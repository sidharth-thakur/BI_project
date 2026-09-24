export function Card({
  hoverable = false,
  className = "",
  children,
  ...props
}) {
  const classes = ["card", hoverable ? "hoverable" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="card-header">
      <div>
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={`card-body ${className}`.trim()}>{children}</div>;
}

export function CardFooter({ children }) {
  return <div className="card-footer">{children}</div>;
}

export default Card;
