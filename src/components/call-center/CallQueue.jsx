import EmptyState from "../common/EmptyState";
import CallCard from "./CallCard";

function SectionSkeleton() {
  return (
    <div className="call-queue-skeleton" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="call-card skeleton-card">
          <span className="skeleton" style={{ height: 16, width: "55%" }} />
          <span className="skeleton" style={{ height: 12, width: "40%" }} />
          <span className="skeleton" style={{ height: 42, width: "100%" }} />
          <span className="skeleton" style={{ height: 12, width: "70%" }} />
        </div>
      ))}
    </div>
  );
}

/**
 * The CRM call queue: grouped, sectioned customer cards.
 * sections: [{ key, title, hint?, variant?, customers: [] }]
 */
export default function CallQueue({
  sections,
  loading = false,
  selectedId,
  emptyState,
  onSelect,
  onLogCall,
  onReschedule,
  onAction,
}) {
  if (loading) {
    return (
      <div aria-label="Loading call queue" role="status">
        <span className="sr-only">Loading call queue…</span>
        <SectionSkeleton />
      </div>
    );
  }

  const total = sections.reduce((sum, section) => sum + section.customers.length, 0);

  if (total === 0) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  return (
    <div className="call-queue">
      {sections
        .filter((section) => section.customers.length > 0)
        .map((section) => (
          <section key={section.key} className="queue-section">
            <header className="queue-section-head">
              <h3>{section.title}</h3>
              <span className="queue-section-count">{section.customers.length}</span>
              {section.hint && <span className="queue-section-hint">{section.hint}</span>}
            </header>
            <div className="queue-cards">
              {section.customers.map((customer) => (
                <CallCard
                  key={customer.id}
                  customer={customer}
                  variant={section.variant}
                  selected={customer.id === selectedId}
                  onSelect={onSelect}
                  onLogCall={onLogCall}
                  onReschedule={onReschedule}
                  onAction={onAction}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
