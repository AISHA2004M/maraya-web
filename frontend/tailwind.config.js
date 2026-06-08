/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Hanken Grotesk'", "sans-serif"],
        display: ["'Bodoni Moda'", "serif"],
      },
      colors: {
        surface: {
          DEFAULT: '#f9f9f9',
          dim: '#dadada',
          bright: '#f9f9f9',
          'container-lowest': '#ffffff',
          'container-low': '#f3f3f4',
          container: '#eeeeee',
          'container-high': '#e8e8e8',
          'container-highest': '#e2e2e2',
          tint: '#5e5e5e',
          variant: '#e2e2e2',
        },
        'on-surface': {
          DEFAULT: '#1a1c1c',
          variant: '#4c4546',
        },
        primary: {
          DEFAULT: '#000000',
          container: '#1b1b1b',
          fixed: '#e2e2e2',
          'fixed-dim': '#c6c6c6',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#848484',
          fixed: '#1b1b1b',
          'fixed-variant': '#474747',
        },
        secondary: {
          DEFAULT: '#5e5e5e',
          container: '#e1dfdf',
          fixed: '#e4e2e2',
          'fixed-dim': '#c7c6c6',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#626262',
          fixed: '#1b1c1c',
          'fixed-variant': '#464747',
        },
        tertiary: {
          DEFAULT: '#000000',
          container: '#1a1c1c',
          fixed: '#e2e2e2',
          'fixed-dim': '#c6c6c7',
        },
        'on-tertiary': {
          DEFAULT: '#ffffff',
          container: '#838484',
          fixed: '#1a1c1c',
          'fixed-variant': '#454747',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a',
        },
        background: '#f9f9f9',
        'on-background': '#1a1c1c',
        outline: {
          DEFAULT: '#7e7576',
          variant: '#cfc4c5',
        },
        ink: '#000000',
        oyster: '#f5f5f5',
        slate: '#767676',
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        base: '8px',
        'margin-mobile': '16px',
        'margin-desktop': '64px',
        gutter: '24px',
      },
      letterSpacing: {
        caps: '0.1em',
      },
      fontSize: {
        'display-lg': ['64px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'headline-lg': ['40px', { lineHeight: '1.2' }],
        'headline-lg-mobile': ['32px', { lineHeight: '1.2' }],
        'headline-md': ['24px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        'body-md': ['16px', { lineHeight: '1.6' }],
        'label-caps': ['12px', { lineHeight: '1.0', letterSpacing: '0.1em' }],
      }
    },
  },
  plugins: [],
};
