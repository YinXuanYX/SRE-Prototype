import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

export const ApplianceCorrectionModal = ({ device, onClose, onSave }) => {
  const [selectedLabel, setSelectedLabel] = useState('Air Conditioner');
  const [customLabel, setCustomLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Air Conditioner',
    'Refrigerator',
    'Water Heater',
    'Microwave Oven',
    'EV Charger',
    'Washing Machine',
    'Induction Cooktop',
    'Common Area Lights',
    'Other (Enter Custom Label below)'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalLabel = selectedLabel === 'Other (Enter Custom Label below)' 
      ? customLabel.trim() 
      : selectedLabel;

    if (!finalLabel) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sre_token');
      const response = await fetch('http://localhost:3000/api/telemetry/retrain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceId: device.deviceId,
          originalLabel: device.deviceName,
          correctedLabel: finalLabel
        })
      });

      if (response.ok) {
        await response.json();
        // Invoke parent save callback with the corrected name
        onSave(device.deviceId, finalLabel);
      } else {
        console.error('[CorrectionModal] Backend retraining post failed:', response.statusText);
      }
    } catch (err) {
      console.error('[CorrectionModal] Error submitting to retraining queue:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.backdrop}>
      <div className="glass-panel animate-in" style={styles.modal}>
        <h3 style={styles.modalTitle}>Appliance Correction Form</h3>
        <p style={styles.modalDesc}>
          Correct the system classification labels if you identify an anomaly or misidentified appliance signature.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Device ID Reference</label>
            <input 
              type="text" 
              value={device.deviceId} 
              disabled 
              style={styles.disabledInput} 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Current Classification Name</label>
            <input 
              type="text" 
              value={device.deviceName} 
              disabled 
              style={styles.disabledInput} 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Correct Appliance Category</label>
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="input-field"
              style={{ appearance: 'none', background: 'var(--bg-elevated)', cursor: 'pointer' }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {selectedLabel === 'Other (Enter Custom Label below)' && (
            <div style={styles.inputGroup} className="animate-in">
              <label style={styles.label}>Custom Appliance Name</label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Master Bedroom Dehumidifier..."
                required
                className="input-field"
              />
            </div>
          )}

          <div style={styles.pdpaNote}>
            <ShieldCheck size={14} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              PDPA Directives: Renaming devices stores overrides locally on your client. Anonymized identifiers are queued for machine-learning feedback loops.
            </span>
          </div>

          <div style={styles.modalButtons}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting} 
              className="btn-secondary"
              style={styles.cancelBtn}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="btn-primary"
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="spin" style={{ marginRight: '6px' }} />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Re-train Classifier</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'var(--bg-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(6px)',
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    padding: 'var(--space-xl)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xl)',
  },
  modalTitle: {
    fontSize: '18px',
    color: 'var(--text-primary)',
    margin: '0 0 var(--space-sm) 0',
  },
  modalDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: '0 0 var(--space-md) 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
  },
  label: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  disabledInput: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    color: 'var(--text-muted)',
    fontSize: '13px',
    outline: 'none',
  },
  pdpaNote: {
    display: 'flex',
    gap: 'var(--space-sm)',
    background: 'rgba(6, 182, 212, 0.05)',
    border: '1px solid rgba(6, 182, 212, 0.15)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-sm)',
    marginTop: 'var(--space-sm)',
  },
  cancelBtn: {
    padding: '8px 16px',
    fontSize: '13px',
  },
  submitBtn: {
    fontSize: '13px',
    padding: '8px 16px',
  },
};
