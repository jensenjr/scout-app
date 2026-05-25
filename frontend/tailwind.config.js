/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Scouterna officiella lila
        scout: {
          50:  '#f5eeff',
          100: '#ead9ff',
          200: '#d4b3ff',
          300: '#b880ff',
          400: '#9b4fd4',
          500: '#7c2db0',
          600: '#6a1f9e',
          700: '#5c2d91',
          800: '#4a1f75',
          900: '#36145a',
        },
      },
    },
  },
  plugins: [],
};
