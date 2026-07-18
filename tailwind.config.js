/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // RULO Picadas brand palette, derived from the logo
        cream: '#F7F6FE',      // page background (soft lavender-white)
        lavender: '#ECEBFB',   // panel / section background
        border: '#E1DEF4',     // hairline borders
        ink: '#241C3D',        // near-black heading text (deep indigo)
        muted: '#6B6480',      // secondary text
        brand: {
          DEFAULT: '#F2410E',  // logo orange-red
          dark: '#C7330A',
          light: '#FFE7DC',
        },
        success: {
          DEFAULT: '#1F9D6C',
          light: '#DDF3E9',
        },
        danger: {
          DEFAULT: '#E23B3B',
          light: '#FBE2E2',
        },
        gold: {
          DEFAULT: '#D89A3E',
          light: '#FBEED9',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 10px rgba(36, 28, 61, 0.06)',
        card: '0 4px 16px rgba(36, 28, 61, 0.08)',
      },
      borderRadius: {
        xl2: '1.1rem',
      },
    },
  },
  plugins: [],
}
