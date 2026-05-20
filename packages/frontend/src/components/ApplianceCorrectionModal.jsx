import React, { useState } from 'react';
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
        const payload = await response.json();
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
      <div className="glass-panel" style={styles.modal}>
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
              style={styles.select}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {selectedLabel === 'Other (Enter Custom Label below)' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Custom Appliance Name</label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Master Bedroom Dehumidifier..."
                required
                style={styles.textInput}
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
                  <span>Submitting signature...</span>
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
    background: 'rgba(5, 5, 8, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    padding: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
  },
  modalTitle: {
    fontSize: '18px',
    color: '#fff',
    margin: '0 0 8px 0',
  },
  modalDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: '0 0 20px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  disabledInput: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: 'var(--text-muted)',
    fontSize: '13px',
    outline: 'none',
  },
  select: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },
  textInput: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
  },
  pdpaNote: {
    display: 'flex',
    gap: '8px',
    background: 'rgba(6, 182, 212, 0.05)',
    border: '1px solid rgba(6, 182, 212, 0.15)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  submitBtn: {
    fontSize: '13px',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
