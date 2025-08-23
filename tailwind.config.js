/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        slowpulse: 'pulse 3s ease-in-out infinite', // langsamer Puls
      },
    },
  },
  plugins: [],
};
