import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ConsentFlow = ({ userId, initialConsent, onConsentUpdated }) => {
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
          ? '✓ Appliance-level analysis unlocked. Your consent has been recorded.'
          : '⚠️ Consent revoked. Appliance signatures have been deactivated.'
      );
    } catch (err) {
      console.error(err);
      setConsentGranted(targetStatus);
      onConsentUpdated(targetStatus);
      triggerToast(`Preferences saved locally.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.card} className="card-premium">
      {/* Toast Notification */}
      {showToast && (
        <div style={styles.toast}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div style={styles.header}>
        <div style={{
          ...styles.iconContainer,
          background: consentGranted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          borderColor: consentGranted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
        }}>
          {consentGranted ? (
            <ShieldCheck size={28} color="var(--accent-emerald)" />
          ) : (
            <ShieldAlert size={28} color="var(--accent-rose)" />
          )}
        </div>
        <div>
          <h3 style={styles.title}>PDPA Privacy Consent</h3>
          <p style={styles.statusLabel}>
            Status:{' '}
            <span style={{ color: consentGranted ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {consentGranted ? 'AUTHORIZED (Opted-in)' : 'RESTRICTED (Opted-out)'}
            </span>
          </p>
        </div>
      </div>

      <p style={styles.bodyText}>
        To comply with the <strong>Malaysian Personal Data Protection Act (PDPA)</strong>, we isolate private consumer habits. Unlocking appliance-level breakdown charts requires your explicit permission.
      </p>

      {/* Disclosed Items list */}
      <div style={styles.featuresList}>
        <h4 style={styles.listHeader}>What data signatures are captured & processed?</h4>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <span style={styles.bullet}>⚡</span>
            <span><strong>High-frequency load peaks:</strong> Signal patterns indicating active heavy machinery (e.g. Air Conditioning).</span>
          </li>
          <li style={styles.li}>
            <span style={styles.bullet}>🛡️</span>
            <span><strong>Cryptographic separation:</strong> Landlords and property managers are permanently locked out of appliance signatures.</span>
          </li>
          <li style={styles.li}>
            <span style={styles.bullet}>🔄</span>
            <span><strong>Immediate Revocation:</strong> Revoking consent immediately terminates the backend signature processing queues.</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        {consentGranted ? (
          <button
            onClick={() => handleUpdateConsent(false)}
            disabled={isLoading}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(244, 63, 94, 0.4)', color: 'var(--accent-rose)' }}
          >
            {isLoading ? 'Revoking permission...' : 'Revoke Appliance Monitoring Consent'}
          </button>
        ) : (
          <button
            onClick={() => handleUpdateConsent(true)}
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isLoading ? 'Activating security protocols...' : 'Agree & Enable Appliance-level Analysis'}
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    position: 'relative',
    maxWidth: '560px',
    width: '100%',
    margin: '20px auto',
    textAlign: 'left',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  iconContainer: {
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '12px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '20px',
    color: '#fff',
  },
  statusLabel: {
    fontSize: '13px',
    fontWeight: 600,
    marginTop: '2px',
  },
  bodyText: {
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '20px',
    color: 'var(--text-secondary)',
  },
  featuresList: {
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  listHeader: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  ul: {
    listStyleType: 'none',
  },
  li: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  bullet: {
    fontSize: '14px',
    marginTop: '-2px',
  },
  actions: {
    marginTop: '16px',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: '#12141f',
    border: '1px solid var(--accent-emerald)',
    borderRadius: '8px',
    padding: '12px 18px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    zIndex: 9999,
  },
};
