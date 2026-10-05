import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../services/api';

const STATUS_FILTERS = [
  { value: '', label: 'All users' },
  { value: 'paid', label: 'Premium' },
  { value: 'free', label: 'Free' },
  { value: 'trialing', label: 'In trial' },
  { value: 'past_due', label: 'Payment problem' },
  { value: 'canceled', label: 'Canceled' },
];

const REFUND_REASONS = [
  { value: '', label: 'No reason' },
  { value: 'requested_by_customer', label: 'Requested by customer' },
  { value: 'duplicate', label: 'Duplicate payment' },
  { value: 'fraudulent', label: 'Fraudulent' },
];

const BADGE_STYLES = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  slate: 'bg-slate-100 text-slate-700',
  pink: 'bg-pink-100 text-pink-800',
};

const STATUS_COLORS = {
  active: 'green',
  paid: 'green',
  succeeded: 'green',
  trialing: 'blue',
  open: 'amber',
  pending: 'amber',
  draft: 'slate',
  past_due: 'red',
  unpaid: 'red',
  incomplete: 'amber',
  incomplete_expired: 'slate',
  failed: 'red',
  uncollectible: 'red',
  canceled: 'slate',
  void: 'slate',
  refunded: 'slate',
};

const formatMoney = (cents, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100);

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const errorMessage = (err, fallback) => {
  const fieldErrors = err?.data?.errors ? Object.values(err.data.errors).flat().join(' ') : null;
  return fieldErrors || err?.data?.message || err?.message || fallback;
};

const Badge = ({ children, color = 'slate' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BADGE_STYLES[color]}`}>
    {children}
  </span>
);

const StatusBadge = ({ status }) => (
  <Badge color={STATUS_COLORS[status] || 'slate'}>{(status || 'none').replace(/_/g, ' ')}</Badge>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  </div>
);

const inputClass = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea3663] focus:border-transparent';
const primaryButtonClass = 'px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#ea3663] hover:bg-[#d12a4f]';
const secondaryButtonClass = 'px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50';

const ModalActions = ({ onCancel, submitting, submitLabel, disabled }) => (
  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
    <button type="button" onClick={onCancel} className={secondaryButtonClass} disabled={submitting}>
      Cancel
    </button>
    <button type="submit" className={primaryButtonClass} disabled={submitting || disabled}>
      {submitting ? 'Working...' : submitLabel}
    </button>
  </div>
);

const RefundModal = ({ payment, onClose, onSubmit }) => {
  const remaining = payment.amount - payment.amount_refunded;
  const [amount, setAmount] = useState((remaining / 100).toFixed(2));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ chargeId: payment.id, amount: parseFloat(amount), reason });
    } catch (err) {
      setError(errorMessage(err, 'Refund failed'));
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Refund Payment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          {payment.description || 'Payment'} on {formatDate(payment.created)}. Up to{' '}
          <span className="font-medium">{formatMoney(remaining, payment.currency)}</span> can be refunded.
        </p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Refund amount</label>
          <input
            type="number"
            min="0.01"
            max={(remaining / 100).toFixed(2)}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
            {REFUND_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500">The money goes back to the customer's card. This can't be undone.</p>
        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
        <ModalActions onCancel={onClose} submitting={submitting} submitLabel="Refund" disabled={!amount} />
      </form>
    </Modal>
  );
};

const PaymentModal = ({ summary, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const card = summary.payment_method;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ amount: parseFloat(amount), description: description.trim() });
    } catch (err) {
      setError(errorMessage(err, 'Payment failed'));
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Take a Payment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Charges the card on file
          {card ? <> (<span className="font-medium capitalize">{card.brand}</span> ending {card.last4})</> : null} right away.
        </p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Amount ({(summary.currency || 'usd').toUpperCase()})</label>
          <input
            type="number"
            min="0.50"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            autoFocus
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Shown on the customer's receipt"
            maxLength={255}
            required
            className={inputClass}
          />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
        <ModalActions
          onCancel={onClose}
          submitting={submitting}
          submitLabel={amount ? `Charge ${formatMoney(Math.round(parseFloat(amount) * 100), summary.currency)}` : 'Charge'}
          disabled={!amount || !description.trim()}
        />
      </form>
    </Modal>
  );
};

const CreditModal = ({ summary, onClose, onSubmit }) => {
  const [months, setMonths] = useState(1);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const price = summary.price;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ months, note: note.trim() });
    } catch (err) {
      setError(errorMessage(err, 'Could not add credit'));
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add Subscription Credit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Credit is added to the customer's Stripe balance and used automatically on their next Premium bills.
        </p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Months</label>
          <select value={months} onChange={(e) => setMonths(parseInt(e.target.value, 10))} className={inputClass}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m} month{m === 1 ? '' : 's'}</option>
            ))}
          </select>
          {price?.unit_amount ? (
            <p className="mt-1 text-xs text-slate-500">
              {months} × {formatMoney(price.unit_amount, price.currency)} ={' '}
              <span className="font-medium text-slate-700">{formatMoney(months * price.unit_amount, price.currency)}</span> credit
            </p>
          ) : (
            <p className="mt-1 text-xs text-red-600">The Premium price couldn't be loaded from Stripe, so credit can't be calculated.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Sorry for the outage"
            maxLength={200}
            className={inputClass}
          />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
        <ModalActions onCancel={onClose} submitting={submitting} submitLabel="Add Credit" disabled={!price?.unit_amount} />
      </form>
    </Modal>
  );
};

const SummaryCard = ({ label, children }) => (
  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">{label}</p>
    {children}
  </div>
);

const Section = ({ title, subtitle, children }) => (
  <div className="mt-8">
    <h3 className="text-lg font-semibold text-slate-800 font-venti">{title}</h3>
    {subtitle && <p className="text-sm text-slate-500 mb-3">{subtitle}</p>}
    <div className="overflow-x-auto border border-slate-200 rounded-xl">{children}</div>
  </div>
);

const Th = ({ children, align = 'left' }) => (
  <th className={`py-3 px-4 text-${align} text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50`}>{children}</th>
);

const EmptyRow = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan} className="py-6 text-center text-sm text-slate-500">{children}</td>
  </tr>
);

const BillingDetail = ({ userId, onBack }) => {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showCredit, setShowCredit] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setHistoryError(null);
    const [summaryResult, historyResult] = await Promise.allSettled([
      adminAPI.billing.getUser(userId),
      adminAPI.billing.getHistory(userId),
    ]);
    if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value);
    else setError(errorMessage(summaryResult.reason, 'Failed to load billing details'));
    if (historyResult.status === 'fulfilled') setHistory(historyResult.value);
    else setHistoryError(errorMessage(historyResult.reason, 'Failed to load billing history'));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setNotice(null);
    load();
  }, [load]);

  const afterAction = async (message) => {
    setRefundTarget(null);
    setShowPayment(false);
    setShowCredit(false);
    setNotice(message);
    await load();
  };

  const handleRefund = async (data) => {
    const result = await adminAPI.billing.refund(userId, data);
    await afterAction(`Refunded ${formatMoney(result.amount, refundTarget?.currency)}.`);
  };

  const handlePayment = async (data) => {
    const result = await adminAPI.billing.takePayment(userId, data);
    await afterAction(`Charged ${formatMoney(result.amount, summary?.currency)}.`);
  };

  const handleCredit = async (data) => {
    const result = await adminAPI.billing.addCredit(userId, data);
    await afterAction(`Added ${result.months} month${result.months === 1 ? '' : 's'} of credit (${formatMoney(result.amount, summary?.price?.currency)}).`);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading billing details...</div>;
  }

  if (!summary) {
    return (
      <div>
        <button type="button" onClick={onBack} className="text-sm text-slate-600 hover:text-slate-800 mb-4">← All users</button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  const { user, subscription, payment_method: card, price } = summary;
  const credit = summary.balance < 0 ? -summary.balance : 0;
  const amountOwed = summary.balance > 0 ? summary.balance : 0;
  const monthsOfCredit = credit && price?.unit_amount ? Math.floor(credit / price.unit_amount) : 0;

  return (
    <div>
      <button type="button" onClick={onBack} className="text-sm text-slate-600 hover:text-slate-800 mb-4">← All users</button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 font-venti">{user.name || user.email}</h2>
          <p className="text-sm text-slate-600">{user.email} · Member since {formatDate(user.created_at)}</p>
          {summary.stripe_customer_id && (
            <p className="text-xs text-slate-400 mt-1 font-mono">{summary.stripe_customer_id}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowCredit(true)} className={secondaryButtonClass}>
            Add Credit
          </button>
          <button
            type="button"
            onClick={() => setShowPayment(true)}
            disabled={!card}
            title={card ? undefined : 'No card on file'}
            className={primaryButtonClass}
          >
            Take Payment
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start justify-between gap-4">
          <p className="text-sm text-green-700">{notice}</p>
          <button type="button" onClick={() => setNotice(null)} className="text-green-700 hover:text-green-900 text-sm" aria-label="Dismiss">×</button>
        </div>
      )}
      {summary.stripe_error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-800">
          Couldn't reach Stripe for live details: {summary.stripe_error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Plan">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-800">{user.plan === 'paid' ? 'Premium' : 'Free'}</span>
            {subscription && <StatusBadge status={subscription.status} />}
          </div>
          {subscription?.cancel_at_period_end && (
            <p className="text-xs text-amber-700 mt-1">Cancels at the end of the period</p>
          )}
        </SummaryCard>
        <SummaryCard label="Billing dates">
          {subscription ? (
            <div className="text-sm text-slate-700 space-y-0.5">
              {subscription.status === 'trialing' && subscription.trial_ends_at && <p>Trial ends {formatDate(subscription.trial_ends_at)}</p>}
              {subscription.ends_at ? (
                <p>Access until {formatDate(subscription.ends_at)}</p>
              ) : subscription.current_period_end ? (
                <p>Next bill {formatDate(subscription.current_period_end)}</p>
              ) : null}
              {price?.unit_amount && <p className="text-slate-500">{formatMoney(price.unit_amount, price.currency)} / {price.interval || 'month'}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No subscription</p>
          )}
        </SummaryCard>
        <SummaryCard label="Card on file">
          {card ? (
            <p className="text-sm text-slate-700"><span className="capitalize font-medium">{card.brand}</span> ending {card.last4}</p>
          ) : (
            <p className="text-sm text-slate-500">None</p>
          )}
        </SummaryCard>
        <SummaryCard label="Account balance">
          {credit > 0 ? (
            <>
              <p className="text-lg font-semibold text-green-700">{formatMoney(credit, summary.currency)} credit</p>
              {monthsOfCredit > 0 && <p className="text-xs text-slate-500">About {monthsOfCredit} month{monthsOfCredit === 1 ? '' : 's'} of Premium</p>}
            </>
          ) : amountOwed > 0 ? (
            <p className="text-lg font-semibold text-red-700">{formatMoney(amountOwed, summary.currency)} owed</p>
          ) : (
            <p className="text-lg font-semibold text-slate-800">{formatMoney(0, summary.currency)}</p>
          )}
        </SummaryCard>
      </div>

      {historyError && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">{historyError}</div>
      )}

      {history && (
        <>
          <Section title="Payments" subtitle="Every charge to this customer's card, newest first">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th>Card</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {history.payments.length === 0 ? (
                  <EmptyRow colSpan={6}>No payments yet</EmptyRow>
                ) : history.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-4 text-sm text-slate-700 whitespace-nowrap">{formatDate(payment.created)}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {payment.description || '—'}
                      {payment.failure_message && <p className="text-xs text-red-600">{payment.failure_message}</p>}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                      {payment.card ? <><span className="capitalize">{payment.card.brand}</span> {payment.card.last4}</> : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right whitespace-nowrap">
                      <span className="text-slate-800">{formatMoney(payment.amount, payment.currency)}</span>
                      {payment.amount_refunded > 0 && (
                        <p className="text-xs text-slate-500">{formatMoney(payment.amount_refunded, payment.currency)} refunded</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={payment.refunded ? 'refunded' : payment.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {payment.receipt_url && (
                          <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-600 hover:text-slate-900 underline">
                            Receipt
                          </a>
                        )}
                        {payment.refundable && (
                          <button
                            type="button"
                            onClick={() => setRefundTarget(payment)}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Invoices" subtitle="Subscription bills and other invoices">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Date</Th>
                  <Th>Invoice</Th>
                  <Th>Period</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Paid</Th>
                  <Th>Status</Th>
                  <Th align="right">Links</Th>
                </tr>
              </thead>
              <tbody>
                {history.invoices.length === 0 ? (
                  <EmptyRow colSpan={7}>No invoices yet</EmptyRow>
                ) : history.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-4 text-sm text-slate-700 whitespace-nowrap">{formatDate(invoice.created)}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      <span className="font-mono text-xs">{invoice.number || invoice.id}</span>
                      {invoice.description && <p className="text-xs text-slate-500">{invoice.description}</p>}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                      {invoice.period_start ? `${formatDate(invoice.period_start)} – ${formatDate(invoice.period_end)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-800 text-right whitespace-nowrap">
                      {formatMoney(invoice.total, invoice.currency)}
                      {invoice.credit_applied > 0 && (
                        <p className="text-xs text-green-700">{formatMoney(invoice.credit_applied, invoice.currency)} credit used</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-800 text-right whitespace-nowrap">{formatMoney(invoice.amount_paid, invoice.currency)}</td>
                    <td className="py-3 px-4"><StatusBadge status={invoice.status} /></td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        {invoice.hosted_invoice_url && (
                          <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-600 hover:text-slate-900 underline">View</a>
                        )}
                        {invoice.invoice_pdf && (
                          <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-600 hover:text-slate-900 underline">PDF</a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Credit & Balance History" subtitle="Credits added and where they were used">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th align="right">Change</Th>
                  <Th align="right">Balance after</Th>
                </tr>
              </thead>
              <tbody>
                {history.credits.length === 0 ? (
                  <EmptyRow colSpan={4}>No credits or balance changes</EmptyRow>
                ) : history.credits.map((txn) => (
                  <tr key={txn.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-4 text-sm text-slate-700 whitespace-nowrap">{formatDate(txn.created)}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {txn.description || txn.type.replace(/_/g, ' ')}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right whitespace-nowrap ${txn.amount < 0 ? 'text-green-700' : 'text-slate-800'}`}>
                      {txn.amount < 0 ? `+${formatMoney(-txn.amount, txn.currency)} credit` : `−${formatMoney(txn.amount, txn.currency)}`}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right whitespace-nowrap">
                      {txn.ending_balance < 0
                        ? `${formatMoney(-txn.ending_balance, txn.currency)} credit`
                        : formatMoney(txn.ending_balance, txn.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {refundTarget && <RefundModal payment={refundTarget} onClose={() => setRefundTarget(null)} onSubmit={handleRefund} />}
      {showPayment && <PaymentModal summary={summary} onClose={() => setShowPayment(false)} onSubmit={handlePayment} />}
      {showCredit && <CreditModal summary={summary} onClose={() => setShowCredit(false)} onSubmit={handleCredit} />}
    </div>
  );
};

const BillingUserList = ({ onSelect }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.billing.getUsers({ page, search, status });
        if (cancelled) return;
        setUsers(response.data || []);
        setTotalPages(response.last_page || 1);
        setTotal(response.total || 0);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Failed to load users'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [page, search, status]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">Billing</h2>
        <p className="text-sm text-slate-600">Subscriptions, payments, refunds, and credits</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
          className="flex-1 min-w-[240px] flex gap-2"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email"
            className={inputClass}
          />
          <button type="submit" className={secondaryButtonClass}>Search</button>
        </form>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea3663]"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-600">{error}</div>}

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <Th>User</Th>
              <Th>Plan</Th>
              <Th>Subscription</Th>
              <Th>Card</Th>
              <Th align="right"> </Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={5}>Loading...</EmptyRow>
            ) : users.length === 0 ? (
              <EmptyRow colSpan={5}>No users found</EmptyRow>
            ) : users.map((user) => (
              <tr
                key={user.id}
                onClick={() => onSelect(user.id)}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
              >
                <td className="py-3 px-4">
                  <p className="text-sm font-medium text-slate-800">{user.name || '—'}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="py-3 px-4">
                  <Badge color={user.plan === 'paid' ? 'pink' : 'slate'}>{user.plan === 'paid' ? 'Premium' : 'Free'}</Badge>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {user.subscription ? (
                    <div className="flex flex-col gap-0.5">
                      <StatusBadge status={user.subscription.status} />
                      {user.subscription.ends_at && <span className="text-xs text-slate-500">Ends {formatDate(user.subscription.ends_at)}</span>}
                    </div>
                  ) : '—'}
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {user.payment_method ? <><span className="capitalize">{user.payment_method.brand}</span> {user.payment_method.last4}</> : '—'}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-xs font-medium text-[#ea3663]">View billing →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>{total} user{total === 1 ? '' : 's'}</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={secondaryButtonClass}>
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={secondaryButtonClass}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminBilling = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get('userId');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {userId ? (
          <BillingDetail userId={userId} onBack={() => setSearchParams({})} />
        ) : (
          <BillingUserList onSelect={(id) => setSearchParams({ userId: String(id) })} />
        )}
      </div>
    </div>
  );
};

export default AdminBilling;
