import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Hourglass,
  Plus,
  Users,
} from "lucide-react";
import Button from "../../components/common/Button";
import ToastStack from "../../components/common/Toast";
import CRMHeader from "../../components/call-center/CRMHeader";
import CRMKpiCards from "../../components/call-center/CRMKpiCards";
import CRMSearchBar from "../../components/call-center/CRMSearchBar";
import CRMFilters from "../../components/call-center/CRMFilters";
import CallTabs from "../../components/call-center/CallTabs";
import CallQueue from "../../components/call-center/CallQueue";
import CustomerPanel from "../../components/call-center/CustomerPanel";
import LogCallModal from "../../components/call-center/LogCallModal";
import RescheduleModal from "../../components/call-center/RescheduleModal";
import CloseLeadModal from "../../components/call-center/CloseLeadModal";
import CallActivityChart from "../../components/call-center/CallActivityChart";
import OutcomeChart from "../../components/call-center/OutcomeChart";
import {
  activityLast7Days,
  activeSet,
  addDays,
  applyFilters,
  closeLead,
  computeKPIs,
  dormantSet,
  formatDisplay,
  formatTime,
  groupToday,
  groupUpcoming,
  listCustomers,
  logCall,
  outcomeDistribution,
  rescheduleFollowUp,
  todayISO,
} from "../../services/callService";

/** Layouts where the customer panel stacks below the queue (see crm.css). */
const STACKED_QUERY =
  "(max-width: 860px), (min-width: 1025px) and (max-width: 1100px)";

const DEFAULT_FILTERS = {
  search: "",
  status: "All Statuses",
  priority: "All Priorities",
  follow: "All Follow-ups",
  followCustom: "",
  assigned: "Everyone",
  company: "All Companies",
};

const EMPTY_STATES = {
  today: {
    icon: CheckCircle2,
    title: "You're all caught up",
    description: "No calls scheduled for today.",
  },
  due: {
    icon: CalendarClock,
    title: "No overdue calls",
    description: "All follow-ups are up to date.",
  },
  upcoming: {
    icon: CalendarClock,
    title: "Nothing upcoming",
    description: "No follow-ups scheduled for the next 7 days.",
  },
  dormant: {
    icon: Hourglass,
    title: "No dormant customers",
    description: "Your customer relationships are active.",
  },
  active: {
    icon: Users,
    title: "No active customers",
    description: "Adjust the filters or log a call to get started.",
  },
  closed: {
    icon: Ban,
    title: "No closed leads",
    description: "Closed leads will appear here.",
  },
};

function dayTitle(date, tomorrow) {
  return date === tomorrow ? "Tomorrow" : formatDisplay(date);
}

export default function CallCenterCRM() {
  /* ---------------- data ---------------- */
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* ---------------- view state ---------------- */
  const [tab, setTab] = useState("today");
  const [search, setSearch] = useState("");
  const deferredSearch = useDebouncedValue(search, 200);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState(null);

  /* ---------------- modals ---------------- */
  const [logOpen, setLogOpen] = useState(false);
  const [logTarget, setLogTarget] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [closing, setClosing] = useState(null);

  /* ---------------- toasts ---------------- */
  const [toasts, setToasts] = useState([]);
  const toastSequence = useRef(0);
  const panelColRef = useRef(null);

  const pushToast = useCallback((toast) => {
    toastSequence.current += 1;
    const id = `toast-${Date.now()}-${toastSequence.current}`;
    setToasts((list) => [...list, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((entry) => entry.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((entry) => entry.id !== id));
  }, []);

  /* ---------------- loading ---------------- */
  const [reloadToken, setReloadToken] = useState(0);
  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setLoadError("");
      const result = await listCustomers();
      if (cancelled) return;
      if (result.ok) {
        setCustomers(result.items);
        setSelectedId((current) => {
          if (current) return current;
          const first = activeSet(result.items)[0];
          return first ? first.id : null;
        });
      } else {
        setLoadError(result.error);
        pushToast({
          tone: "error",
          title: "Unable to load calls",
          message: result.error,
        });
      }
      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [reloadToken, pushToast]);

  /* ---------------- derived ---------------- */
  const kpis = useMemo(() => computeKPIs(customers), [customers]);
  const activity = useMemo(() => activityLast7Days(customers), [customers]);
  const outcomes = useMemo(() => outcomeDistribution(customers), [customers]);

  const filterOptions = useMemo(() => {
    const companies = [...new Set(customers.map((c) => c.name))].sort((a, b) =>
      a.localeCompare(b)
    );
    const assignees = [...new Set(customers.map((c) => c.assignedTo).filter(Boolean))];
    return {
      statuses: ["All Statuses", "New", "Active", "Under Discussion", "Order Received", "No Response", "Closed"],
      priorities: ["All Priorities", "High", "Medium", "Low"],
      assigned: ["Everyone", ...assignees],
      companies: ["All Companies", ...companies],
    };
  }, [customers]);

  const filtered = useMemo(
    () => applyFilters(customers, { ...filters, search: deferredSearch }),
    [customers, filters, deferredSearch]
  );

  const showClosed = filters.status === "Closed";
  const scoped = useMemo(
    () => (showClosed ? filtered : filtered.filter((c) => c.status !== "Closed")),
    [filtered, showClosed]
  );

  const tabCounts = useMemo(() => {
    if (showClosed) {
      return { today: 0, due: 0, upcoming: 0, dormant: 0, active: scoped.length };
    }
    const grouped = groupToday(scoped);
    const upcoming = groupUpcoming(scoped);
    return {
      today:
        grouped.overdue.length + grouped.dueToday.length + grouped.completedToday.length,
      due: grouped.overdue.length + grouped.dueToday.length,
      upcoming: upcoming.reduce((sum, group) => sum + group.items.length, 0),
      dormant: dormantSet(scoped).length,
      active: activeSet(scoped).length,
    };
  }, [scoped, showClosed]);

  const sections = useMemo(() => {
    if (showClosed) {
      return [{ key: "closed", title: "Closed Leads", customers: scoped }];
    }
    const tomorrow = addDays(todayISO(), 1);
    switch (tab) {
      case "today": {
        const grouped = groupToday(scoped);
        return [
          { key: "overdue", title: "Overdue", hint: "Needs attention first", customers: grouped.overdue },
          { key: "due", title: "Due Today", customers: grouped.dueToday },
          { key: "done", title: "Completed Today", customers: grouped.completedToday },
        ];
      }
      case "due": {
        const grouped = groupToday(scoped);
        return [
          { key: "overdue", title: "Overdue", hint: "Needs attention first", customers: grouped.overdue },
          { key: "due", title: "Due Today", customers: grouped.dueToday },
        ];
      }
      case "upcoming":
        return groupUpcoming(scoped).map((group) => ({
          key: group.date,
          title: dayTitle(group.date, tomorrow),
          hint: `${group.items.length} call${group.items.length === 1 ? "" : "s"}`,
          customers: group.items,
        }));
      case "dormant":
        return [
          {
            key: "dormant",
            title: "Dormant Customers",
            hint: `No activity in 21+ days`,
            variant: "dormant",
            customers: dormantSet(scoped),
          },
        ];
      default:
        return [{ key: "active", title: "All Active Customers", customers: activeSet(scoped) }];
    }
  }, [scoped, tab, showClosed]);

  const selected = useMemo(
    () => customers.find((customer) => customer.id === selectedId) ?? null,
    [customers, selectedId]
  );

  const hasFilters =
    Boolean(filters.search) ||
    Object.entries(filters).some(
      ([key, value]) =>
        key !== "search" &&
        value !== DEFAULT_FILTERS[key] &&
        !(key === "followCustom" && value === "")
    );

  /* ---------------- actions ---------------- */
  /**
   * Select a call card. On stacked layouts the panel sits below the queue,
   * so bring it into view — otherwise the tap appears to do nothing.
   */
  function selectCustomer(customer) {
    setSelectedId(customer.id);
    if (typeof window === "undefined" || !window.matchMedia(STACKED_QUERY).matches) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      panelColRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  function patchFilter(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
  }

  function openLog(customer) {
    setLogTarget(customer ?? null);
    setLogOpen(true);
  }

  async function handleLogCall(customer, form) {
    const result = await logCall(customer.id, form);
    if (result.ok) {
      setCustomers((list) =>
        list.map((entry) => (entry.id === result.record.id ? result.record : entry))
      );
      setSelectedId(result.record.id);
      setLogOpen(false);
      pushToast({
        tone: "success",
        title: "Call logged successfully",
        message: result.scheduledFor
          ? `Next follow-up scheduled for ${formatDisplay(result.scheduledFor)}.`
          : "No follow-up scheduled.",
      });
    } else {
      pushToast({
        tone: "error",
        title: "Unable to save call",
        message: result.error,
      });
    }
    return result;
  }

  async function handleReschedule(customer, form) {
    const result = await rescheduleFollowUp(customer.id, form);
    if (result.ok) {
      setCustomers((list) =>
        list.map((entry) => (entry.id === result.record.id ? result.record : entry))
      );
      setRescheduling(null);
      pushToast({
        tone: "success",
        title: "Follow-up rescheduled",
        message: `${customer.name} → ${formatDisplay(form.date)} · ${formatTime(form.time)}`,
      });
    } else {
      pushToast({
        tone: "error",
        title: "Unable to schedule follow-up",
        message: result.error,
      });
    }
    return result;
  }

  async function handleCloseLead(customer, reason) {
    const result = await closeLead(customer.id, reason);
    if (result.ok) {
      setCustomers((list) =>
        list.map((entry) => (entry.id === result.record.id ? result.record : entry))
      );
      setClosing(null);
      pushToast({
        tone: "success",
        title: "Lead closed",
        message: `${customer.name} closed — ${reason}. History preserved.`,
      });
    } else {
      pushToast({
        tone: "error",
        title: "Unable to update status",
        message: result.error,
      });
    }
    return result;
  }

  function handleCardAction(action, customer) {
    if (action === "view") selectCustomer(customer);
    else if (action === "reschedule") setRescheduling(customer);
    else if (action === "close") setClosing(customer);
  }

  const emptyState = showClosed ? EMPTY_STATES.closed : EMPTY_STATES[tab];
  const queueTotal = sections.reduce((sum, section) => sum + section.customers.length, 0);

  /* ---------------- render ---------------- */
  return (
    <div className="crm-page">
      <CRMHeader
        title="Call Center CRM"
        subtitle="Manage customer calls, follow-ups and sales opportunities"
      >
        <Button variant="accent" onClick={() => openLog(null)}>
          <Plus size={16} /> Log Call
        </Button>
      </CRMHeader>

      <CRMKpiCards kpis={kpis} loading={loading} />

      {kpis.overdue > 0 && !loading && (
        <button
          type="button"
          className="crm-alert"
          onClick={() => setTab("due")}
        >
          You have {kpis.overdue} overdue follow-up{kpis.overdue === 1 ? "" : "s"}
          <span className="crm-alert-cta">Open Due Calls →</span>
        </button>
      )}

      {loadError && (
        <div className="inline-banner error" role="alert">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      <CallTabs active={tab} onChange={setTab} counts={tabCounts} />

      <div className="crm-toolbar">
        <CRMSearchBar
          value={search}
          onChange={setSearch}
          resultCount={loading ? null : queueTotal}
        />
        <CRMFilters
          filters={filters}
          options={filterOptions}
          onChange={patchFilter}
          onReset={resetFilters}
          dirty={hasFilters}
        />
      </div>

      <div className="crm-workspace">
        <div className="crm-queue-col">
          <CallQueue
            sections={sections}
            loading={loading}
            selectedId={selectedId}
            emptyState={emptyState}
            onSelect={selectCustomer}
            onLogCall={openLog}
            onReschedule={setRescheduling}
            onAction={handleCardAction}
          />
        </div>
        <aside ref={panelColRef} className="crm-panel-col" aria-label="Customer details">
          <CustomerPanel
            customer={selected}
            loading={loading}
            onLogCall={openLog}
            onReschedule={setRescheduling}
            onNotify={pushToast}
            onNoteAdded={(record) =>
              setCustomers((list) =>
                list.map((entry) => (entry.id === record.id ? record : entry))
              )
            }
          />
        </aside>
      </div>

      <div className="crm-charts">
        <CallActivityChart data={activity} loading={loading} />
        <OutcomeChart data={outcomes} loading={loading} />
      </div>

      <LogCallModal
        open={logOpen}
        customer={logTarget}
        customers={customers.filter((entry) => entry.status !== "Closed")}
        onClose={() => setLogOpen(false)}
        onSave={handleLogCall}
      />

      <RescheduleModal
        open={Boolean(rescheduling)}
        customer={rescheduling}
        onClose={() => setRescheduling(null)}
        onSave={handleReschedule}
      />

      <CloseLeadModal
        open={Boolean(closing)}
        customer={closing}
        onClose={() => setClosing(null)}
        onConfirm={handleCloseLead}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

/** Debounce a fast-changing value (search) to avoid re-filtering per keystroke. */
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
