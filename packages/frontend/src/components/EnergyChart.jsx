import React, { useState, useRef, useEffect } from 'react';

export const EnergyChart = ({ data }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(500);

  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      setContainerWidth(containerRef.current.clientWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div style={styles.emptyState}>
        <span>No historical data parameters available.</span>
      </div>
    );
  }

  const svgHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = containerWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Find boundaries
  const maxVal = Math.max(...data.map(d => d.kwh), 5); // default min height scale of 5 kWh
  const minVal = 0;

  // Build points
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.kwh / maxVal) * chartHeight;
    return { x, y, label: d.label, val: d.kwh };
  });

  // Path commands
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  // Hover detection
  const handleMouseMove = (e) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - paddingLeft;
    
    // Find closest point index
    const relativeXFraction = mouseX / chartWidth;
    let closestIdx = Math.round(relativeXFraction * (points.length - 1));
    closestIdx = Math.max(0, Math.min(points.length - 1, closestIdx));
    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Generate horizontal gridlines
  const gridLines = [];
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const fraction = i / ticks;
    const val = maxVal * fraction;
    const y = paddingTop + chartHeight - fraction * chartHeight;
    gridLines.push({ y, val: val.toFixed(1) });
  }

  return (
    <div 
      ref={containerRef} 
      style={styles.container} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg width={containerWidth} height={svgHeight} style={styles.svg}>
        <defs>
          {/* Neon Glow Linear Gradient for Area Chart */}
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0.0" />
          </linearGradient>
          {/* Glowing dot shadow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Gridlines */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line 
              x1={paddingLeft} 
              y1={line.y} 
              x2={containerWidth - paddingRight} 
              y2={line.y} 
              style={styles.gridLine} 
            />
            <text 
              x={paddingLeft - 8} 
              y={line.y + 4} 
              style={styles.yLabel}
            >
              {line.val}
            </text>
          </g>
        ))}

        {/* Area Path */}
        {areaPath && (
          <path d={areaPath} fill="url(#chartGradient)" />
        )}

        {/* Line Path */}
        {linePath && (
          <path 
            d={linePath} 
            fill="none" 
            stroke="var(--accent-blue)" 
            strokeWidth="2.5" 
            strokeLinecap="round"
          />
        )}

        {/* X Ticks Label (Show subset if too many labels) */}
        {points.map((p, idx) => {
          const modulo = Math.ceil(points.length / 8);
          if (idx % modulo !== 0 && idx !== points.length - 1) return null;
          return (
            <text
              key={idx}
              x={p.x}
              y={paddingTop + chartHeight + 20}
              style={styles.xLabel}
            >
              {p.label}
            </text>
          );
        })}

        {/* Hover Line vertical indicator */}
        {hoverIndex !== null && points[hoverIndex] && (
          <line
            x1={points[hoverIndex].x}
            y1={paddingTop}
            x2={points[hoverIndex].x}
            y2={paddingTop + chartHeight}
            style={styles.hoverLine}
          />
        )}

        {/* Interactive Dots */}
        {points.map((p, idx) => {
          const isHovered = hoverIndex === idx;
          return (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={isHovered ? 6 : 3}
              fill={isHovered ? 'var(--accent-cyan)' : 'var(--accent-blue)'}
              stroke="var(--bg-surface)"
              strokeWidth={isHovered ? 2 : 1}
              style={isHovered ? { filter: 'url(#glow)', transition: 'all 0.1s ease' } : {}}
            />
          );
        })}
      </svg>

      {/* Floating Hover Tooltip Card */}
      {hoverIndex !== null && points[hoverIndex] && (
        <div 
          style={{
            ...styles.tooltip,
            left: `${points[hoverIndex].x - 60}px`,
            top: `${points[hoverIndex].y - 55}px`
          }}
        >
          <div style={styles.tooltipLabel}>{points[hoverIndex].label}</div>
          <div style={styles.tooltipVal}>{points[hoverIndex].val} <span style={{ fontSize: '10px' }}>kWh</span></div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    background: 'transparent',
    padding: '16px 12px 8px 12px',
    boxSizing: 'border-box',
  },
  svg: {
    overflow: 'visible',
    display: 'block',
  },
  gridLine: {
    stroke: 'var(--chart-grid)',
    strokeWidth: 1,
    strokeDasharray: '4 4',
  },
  yLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fill: 'var(--text-muted)',
    textAnchor: 'end',
  },
  xLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    fill: 'var(--text-muted)',
    textAnchor: 'middle',
  },
  hoverLine: {
    stroke: 'rgba(6, 182, 212, 0.3)',
    strokeWidth: 1,
    strokeDasharray: '3 3',
  },
  tooltip: {
    position: 'absolute',
    background: 'var(--chart-tooltip-bg)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 10px',
    boxShadow: 'var(--shadow-md)',
    pointerEvents: 'none',
    width: '100px',
    textAlign: 'center',
    zIndex: 20,
    transition: 'left 0.1s ease, top 0.1s ease',
  },
  tooltipLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  tooltipVal: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: '2px',
  },
  emptyState: {
    height: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-input)',
    border: '1px dashed var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
};
