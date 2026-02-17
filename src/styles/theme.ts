export const theme = {
  colors: {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryLighter: '#93c5fd',
    primaryDark: '#2563eb',
    primaryDarker: '#1d4ed8',
    
    secondary: '#64748b',
    secondaryLight: '#94a3b8',
    secondaryLighter: '#cbd5e1',
    
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    
    background: '#f8fafc',
    backgroundLight: '#f1f5f9',
    backgroundDark: '#e2e8f0',
    
    surface: '#ffffff',
    surfaceHover: '#f8fafc',
    
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      tertiary: '#64748b',
      disabled: '#94a3b8',
      inverse: '#ffffff'
    },
    
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    
    shadow: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
    },
    
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      light: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      soft: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
    }
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px'
  },
  
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px'
  },
  
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px'
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070
  },
  
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)'
  }
}

export default theme
