import { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

export const ConsentFlow = ({ userId, initialConsent, onConsentUpdated, isModal = false }) => {
  const [consentGranted, setConsentGranted] = useState(initialConsent);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUpdateConsent = async (targetStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sre_token')}`
        },
        body: JSON.stringify({
          userId,
          consentType: 'appliance_breakdown',
          status: targetStatus ? 'Granted' : 'Revoked'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update consent registry');
      }

      setConsentGranted(targetStatus);
      onConsentUpdated(targetStatus);
      triggerToast(
        targetStatus
          ? '✓ Consent record updated. Security channels initialized.'
          : '⚠️ Consent revoked. Appliance signatures have been deactivated.'
      );
    } catch (err) {
      console.error(err);
      setConsentGranted(targetStatus);
      onConsentUpdated(targetStatus);
      triggerToast(`Preferences updated locally.`);
    } finally {
      setIsLoading(false);
    }
  };

  const cardStyle = isModal ? s.modalCard : s.card;

  return (
    <div style={cardStyle} className="surface-card animate-in">
      {/* Toast Notification */}
      {showToast && (
        <div style={s.toast}>
          <CheckCircle2 size={14} color="var(--accent-emerald)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {isModal && (
        <div style={s.modalGateHeader}>
          <Lock size={14} color="var(--accent-rose)" />
          <span>SECURE PRIVACY GATEWAY</span>
        </div>
      )}

      <div style={s.header}>
        <div style={{
          ...s.iconContainer,
          background: consentGranted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
          borderColor: consentGranted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
        }}>
          {consentGranted ? (
            <ShieldCheck size={20} color="var(--accent-emerald)" />
          ) : (
            <ShieldAlert size={20} color="var(--accent-rose)" />
          )}
        </div>
        <div>
          <h3 style={s.title}>{isModal ? 'Authorize Sub-Meter Ingestion' : 'PDPA Consent Settings'}</h3>
          <p style={s.statusLabel}>
            Verification Status:{' '}
            <span style={{ color: consentGranted ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {consentGranted ? 'Opted-In (Authorized)' : 'Opted-Out (Gated)'}
            </span>
          </p>
        </div>
      </div>

      <p style={s.bodyText}>
        To comply with the <strong>Malaysian Personal Data Protection Act (PDPA)</strong>, GridPulse isolates high-frequency electrical load signature analysis. Property administrators and landlords remain completely gated from viewing your specific appliance metrics.
      </p>

      <div style={s.featuresList}>
        <h4 style={s.listHeader}>Directives for consent authorization:</h4>
        <ul style={s.ul}>
          <li style={s.li}>
            <span style={s.bullet}>⚡</span>
            <span><strong>Load Ingestion:</strong> Deconstruct high-frequency voltage fluctuations into specific appliance footprints.</span>
          </li>
          <li style={s.li}>
            <span style={s.bullet}>🛡️</span>
            <span><strong>Tenancy Privacy:</strong> Lock detailed profiles away from property owners (only aggregated building load is exposed).</span>
          </li>
        </ul>
      </div>

      <div style={s.actions}>
        {consentGranted ? (
          <button
            onClick={() => handleUpdateConsent(false)}
            disabled={isLoading}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)' }}
          >
            {isLoading ? 'Revoking permission...' : 'Revoke Appliance Monitoring Permission'}
          </button>
        ) : (
          <button
            onClick={() => handleUpdateConsent(true)}
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 0' }}
          >
            {isLoading ? 'Activating security protocols...' : 'Agree & Authorize Analytics'}
          </button>
        )}
      </div>
    </div>
  );
};

const s = {
  card: {
    position: 'relative',
    maxWidth: '560px',
    width: '100%',
    margin: 'var(--space-md) auto 0 auto',
    padding: 'var(--space-lg)',
  },
  modalCard: {
    position: 'relative',
    maxWidth: '480px',
    width: '100%',
    padding: 'var(--space-xl) var(--space-lg)',
    boxShadow: 'var(--shadow-2xl)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-surface)',
  },
  modalGateHeader: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    background: 'rgba(244, 63, 94, 0.08)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '9px',
    fontWeight: 700,
    color: 'var(--accent-rose)',
    letterSpacing: '0.08em',
    marginBottom: 'var(--space-md)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)',
  },
  iconContainer: {
    borderWidth: '1px',
    borderStyle: 'solid',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '15px',
    color: 'var(--text-primary)',
    margin: 0,
    fontWeight: 700,
  },
  statusLabel: {
    fontSize: '11px',
    fontWeight: 600,
    marginTop: '2px',
    color: 'var(--text-secondary)',
  },
  bodyText: {
    fontSize: '12px',
    lineHeight: '1.6',
    marginBottom: 'var(--space-md)',
    color: 'var(--text-secondary)',
  },
  featuresList: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
  },
  listHeader: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-sm)',
  },
  ul: {
    listStyleType: 'none',
  },
  li: {
    fontSize: '12px',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-sm)',
  },
  bullet: {
    fontSize: '12px',
  },
  actions: {
    marginTop: 'var(--space-md)',
  },
  toast: {
    position: 'fixed',
    bottom: 'var(--space-lg)',
    right: 'var(--space-lg)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--accent-emerald)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 18px',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontSize: '12px',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 9999,
  },
};
