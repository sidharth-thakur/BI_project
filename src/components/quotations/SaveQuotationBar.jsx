import { Eye, FileText, Loader2, Save, X } from "lucide-react";
import Button from "../common/Button";

/**
 * Sticky bottom action bar: Cancel / Save Draft / Preview / Save Quotation.
 * Save Quotation uses the V BIOCHEM accent.
 */
export default function SaveQuotationBar({
  onCancel,
  onSaveDraft,
  onPreview,
  onSave,
  saving = false,
  hint,
}) {
  return (
    <div className="quote-action-bar no-print">
      <div className="quote-action-inner">
        {hint && <p className="quote-action-hint">{hint}</p>}
        <div className="quote-action-buttons">
          <Button variant="ghost" onClick={onCancel}>
            <X size={16} /> Cancel
          </Button>
          <Button variant="secondary" onClick={onSaveDraft} disabled={saving}>
            <FileText size={16} /> Save Draft
          </Button>
          <Button variant="outline" onClick={onPreview} disabled={saving}>
            <Eye size={16} /> Preview
          </Button>
          <Button variant="accent" onClick={onSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={16} className="spin-once" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Quotation
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
