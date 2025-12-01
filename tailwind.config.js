/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d0d9',
          300: '#f4a8b8',
          400: '#ed7691',
          500: '#e0486d',
          600: '#c92a52',
          700: '#a81d43',
          800: '#8b1a3d',
          900: '#761838',
        },
      },
    },
  },
  plugins: [],
};
