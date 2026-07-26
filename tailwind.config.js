export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EFF2ED',
        surface: '#FFFFFF',
        band: '#F4F7F1',
        line: { DEFAULT: '#DCE2D9', strong: '#C3CCBF' },
        ink: { 400: '#8A9791', 500: '#5C6B64', 700: '#2C3A34', 900: '#14201B' },
        st: {
          draft: '#6E7A74', sent: '#2F5D8C', approved: '#1F6B4E',
          rejected: '#A33A28', expired: '#8A6212',
        },
        focus: '#2F5D8C',
        danger: '#A33A28',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
      },
      fontSize: {
        label: ['12px', { lineHeight: '16px', letterSpacing: '0.06em' }],
        small: ['13px', { lineHeight: '18px' }],
        body: ['14px', { lineHeight: '20px' }],
        h3: ['15px', { lineHeight: '20px' }],
        h2: ['18px', { lineHeight: '24px' }],
        h1: ['22px', { lineHeight: '28px' }],
        display: ['28px', { lineHeight: '34px' }],
      },
      borderRadius: { control: '6px', card: '8px', chip: '4px' },
      transitionTimingFunction: { std: 'cubic-bezier(.2,.8,.3,1)' },
    },
  },
};
