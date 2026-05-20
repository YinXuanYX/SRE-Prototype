import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Loader2,
  Layers,
  Home,
  Zap
} from 'lucide-react';

export const ZoneMapper = ({ user }) => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New zone form state
  const [formName, setFormName] = useState('');
  const [formFloor, setFormFloor] = useState('');
  const [formType, setFormType] = useState('Residential');
  const [formTenant, setFormTenant] = useState('');
  const [formDevices, setFormDevices] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sre_token');
      const res = await fetch('http://localhost:3000/api/zones', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (err) {
      console.error('[ZoneMapper] Failed to fetch zones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formFloor.trim()) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('sre_token');
      const res = await fetch('http://localhost:3000/api/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          floor: formFloor,
          type: formType,
          devices: formDevices.split(',').map(d => d.trim()).filter(Boolean),
          tenant: formTenant || 'Unassigned'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setZones(prev => [...prev, data.zone]);
        setShowCreateForm(false);
        setFormName('');
        setFormFloor('');
        setFormTenant('');
        setFormDevices('');
      }
    } catch (err) {
      console.error('[ZoneMapper] Failed to create zone:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      const token = localStorage.getItem('sre_token');
      const res = await fetch(`http://localhost:3000/api/zones/${zoneId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setZones(prev => prev.filter(z => z.id !== zoneId));
      }
    } catch (err) {
      console.error('[ZoneMapper] Failed to delete zone:', err);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Residential': return { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-blue)' };
      case 'Common Area': return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)' };
      case 'Utility': return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' };
      default: return { bg: 'rgba(255,255,255,0.05)', border: 'var(--border-color)', color: 'var(--text-secondary)' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--accent-cyan)" />
          <h3 style={{ margin: 0, fontSize: '16px' }}>Digital Sub-Metering Zone Mapper</h3>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={styles.addBtn}
        >
          <Plus size={14} style={{ marginRight: '4px' }} />
          <span>{showCreateForm ? 'Cancel' : 'Register New Zone'}</span>
        </button>
      </div>

      {/* Create Zone Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateZone} style={styles.createForm}>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Zone / Room Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Unit C-305"
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Floor Level</label>
              <input
                type="text"
                value={formFloor}
                onChange={(e) => setFormFloor(e.target.value)}
                placeholder="e.g. Level 3"
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Zone Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                style={styles.select}
              >
                <option value="Residential">Residential</option>
                <option value="Common Area">Common Area</option>
                <option value="Utility">Utility</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Assigned Tenant</label>
              <input
                type="text"
                value={formTenant}
                onChange={(e) => setFormTenant(e.target.value)}
                placeholder="e.g. Jane Doe"
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Linked Device IDs (comma-separated)</label>
            <input
              type="text"
              value={formDevices}
              onChange={(e) => setFormDevices(e.target.value)}
              placeholder="e.g. device-aircon-01, device-fridge-01"
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={creating} className="btn-primary" style={styles.submitBtn}>
            {creating ? (
              <><Loader2 size={14} className="spin" style={{ marginRight: '6px' }} /><span>Registering...</span></>
            ) : (
              <span>Create Zone Mapping</span>
            )}
          </button>
        </form>
      )}

      {/* Zone Cards Grid */}
      {loading ? (
        <div style={styles.loaderContainer}>
          <Loader2 size={24} className="spin" color="var(--accent-cyan)" />
          <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Loading zone configurations...</span>
        </div>
      ) : zones.length === 0 ? (
        <div style={styles.emptyState}>
          <MapPin size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
          <p>No zones configured. Click "Register New Zone" to begin mapping.</p>
        </div>
      ) : (
        <div style={styles.zoneGrid}>
          {zones.map(zone => {
            const typeStyle = getTypeColor(zone.type);
            return (
              <div key={zone.id} style={styles.zoneCard}>
                <div style={styles.zoneHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Home size={16} color={typeStyle.color} />
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>{zone.name}</h4>
                  </div>
                  <button onClick={() => handleDeleteZone(zone.id)} style={styles.deleteBtn} title="Remove zone">
                    <Trash2 size={12} />
                  </button>
                </div>

                <div style={styles.zoneMetaRow}>
                  <span style={styles.zoneFloor}>📍 {zone.floor}</span>
                  <span style={{
                    ...styles.typeBadge,
                    background: typeStyle.bg,
                    border: `1px solid ${typeStyle.border}`,
                    color: typeStyle.color
                  }}>
                    {zone.type}
                  </span>
                </div>

                <div style={styles.zoneTenant}>
                  <span style={styles.tenantLabel}>Tenant:</span>
                  <span style={styles.tenantName}>{zone.tenant}</span>
                </div>

                <div style={styles.deviceTagList}>
                  {zone.devices.map(devId => (
                    <span key={devId} style={styles.deviceTag}>
                      <Zap size={10} style={{ marginRight: '3px' }} />
                      {devId}
                    </span>
                  ))}
                  {zone.devices.length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No devices linked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(6, 182, 212, 0.08)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    color: 'var(--accent-cyan)',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  createForm: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  input: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '8px 10px',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
  },
  select: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '8px 10px',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '8px 16px',
    fontSize: '12px',
    alignSelf: 'flex-start',
  },
  loaderContainer: {
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.1)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
  },
  emptyState: {
    padding: '30px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '13px',
    background: 'rgba(0,0,0,0.1)',
    border: '1px dashed var(--border-color)',
    borderRadius: '12px',
  },
  zoneGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '14px',
  },
  zoneCard: {
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  zoneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent-rose)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
  zoneMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneFloor: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  typeBadge: {
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  zoneTenant: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  tenantLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  tenantName: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
  },
  deviceTagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    borderTop: '1px dashed var(--border-color)',
    paddingTop: '10px',
  },
  deviceTag: {
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.15)',
    color: 'var(--accent-blue)',
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
  },
};
