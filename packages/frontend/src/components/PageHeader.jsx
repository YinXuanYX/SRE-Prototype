import React from 'react';
import { ChevronRight } from 'lucide-react';

export const PageHeader = ({ title, subtitle, breadcrumb, actions, children }) => {
  return (
    <header style={s.header} className="animate-in">
      <div style={s.left}>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="breadcrumb" style={s.breadcrumb}>
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={10} className="breadcrumb-sep" />}
                <span className={i === breadcrumb.length - 1 ? 'breadcrumb-current' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 style={s.title}>{title}</h1>
        {subtitle && <p style={s.subtitle}>{subtitle}</p>}
      </div>
      <div style={s.right}>
        {actions}
        {children}
      </div>
    </header>
  );
};

const s = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 'var(--space-md)',
    borderBottom: '1px solid var(--border-subtle)',
    gap: 'var(--space-md)',
    flexWrap: 'wrap',
  },
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  breadcrumb: {
    marginBottom: '2px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    flexShrink: 0,
  },
};
