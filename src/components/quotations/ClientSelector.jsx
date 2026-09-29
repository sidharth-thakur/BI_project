import { useState } from "react";
import { UserPlus, UserRound } from "lucide-react";
import { Card, CardBody, CardHeader } from "../common/Card";
import Button from "../common/Button";
import Modal from "../common/Modal";
import ClientCombobox from "./ClientCombobox";
import { createClient } from "../../services/clientService";

const EMPTY_CLIENT_FORM = { company: "", contact: "", address: "" };

/**
 * Client Information card: searchable client selector + inline
 * "Add New Client" modal. Emits the selected client to the parent form.
 */
export default function ClientSelector({ client, onSelect, error }) {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CLIENT_FORM);
  const [savingClient, setSavingClient] = useState(false);
  const [formError, setFormError] = useState("");

  async function saveClient() {
    setSavingClient(true);
    setFormError("");
    const result = await createClient(form);
    setSavingClient(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    onSelect?.(result.client);
    setForm(EMPTY_CLIENT_FORM);
    setAddOpen(false);
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Client Information"
          subtitle="Select the customer for this quotation"
          action={
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus size={15} /> Add New Client
            </Button>
          }
        />
        <CardBody>
          <div className="field">
            <label htmlFor="client-search">Client</label>
            <ClientCombobox
              id="client-search"
              invalid={Boolean(error)}
              onSelect={onSelect}
            />
            {error && <p className="field-error">{error}</p>}
          </div>

          {client ? (
            <div className="client-summary" aria-live="polite">
              <div className="client-summary-icon" aria-hidden="true">
                <UserRound size={18} />
              </div>
              <dl className="client-summary-grid">
                <div>
                  <dt>Company</dt>
                  <dd>{client.company}</dd>
                </div>
                <div>
                  <dt>Contact Person</dt>
                  <dd>{client.contact || "—"}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{client.address || "—"}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="client-hint">Select a client to continue</p>
          )}
        </CardBody>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Client"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveClient}
              disabled={savingClient || !form.company.trim()}
            >
              {savingClient ? "Saving..." : "Save Client"}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="new-client-company">Company</label>
            <input
              id="new-client-company"
              value={form.company}
              onChange={(event) =>
                setForm({ ...form, company: event.target.value })
              }
              placeholder="e.g. ABC Pharma Ltd."
              autoFocus
            />
          </div>
          <div className="field full">
            <label htmlFor="new-client-contact">Contact Person</label>
            <input
              id="new-client-contact"
              value={form.contact}
              onChange={(event) =>
                setForm({ ...form, contact: event.target.value })
              }
              placeholder="e.g. Rahul Sharma"
            />
          </div>
          <div className="field full">
            <label htmlFor="new-client-address">Address</label>
            <input
              id="new-client-address"
              value={form.address}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
              placeholder="e.g. Industrial Area, Chandigarh"
            />
          </div>
        </div>
        {formError && <p className="field-error">{formError}</p>}
        <p className="form-note">
          The new client is selected automatically once saved.
        </p>
      </Modal>
    </>
  );
}
