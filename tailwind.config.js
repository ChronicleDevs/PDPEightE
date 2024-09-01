/** @type {import('tailwindcss').Config} */

const colors = require("tailwindcss/colors");
module.exports = {
  content: ["./views/**/*.{ejs,jsx,ts,tsx}"],
  theme: {

    extend: {
      fontFamily: {
        dmsans: ["DM Sans", "sans-serif"],
        ariba: ["Ariba", "DM Sans", "sans-serif"],
      },

      animation: {
        gradient: 'gradient 15s ease infinite',
      },

      colors
    },
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-bg-patterns")],
}

