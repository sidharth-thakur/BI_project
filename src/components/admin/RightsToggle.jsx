import { ACCESS_LEVELS } from "../../services/userService";

const LABELS = { edit: "Edit", read: "Read only" };

/**
 * Segmented Edit / Read-only control for one module's access right.
 * Used inline in the users table and inside the user form modal.
 */
export default function RightsToggle({
  moduleLabel,
  value,
  onChange,
  disabled = false,
  idPrefix = "rights",
}) {
  const groupId = `${idPrefix}-${moduleLabel.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      className={`rights-toggle${disabled ? " disabled" : ""}`}
      role="group"
      aria-label={`${moduleLabel} access`}
    >
      {ACCESS_LEVELS.map((level) => {
        const optionId = `${groupId}-${level}`;
        const active = value === level;
        return (
          <button
            key={level}
            type="button"
            id={optionId}
            className={`rights-option${active ? " active" : ""}`}
            aria-pressed={active}
            disabled={disabled || !onChange}
            onClick={() => onChange?.(level)}
          >
            {LABELS[level]}
          </button>
        );
      })}
    </div>
  );
}
