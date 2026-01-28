/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/components/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "galaxy-dark": "#060c1c",
        "galaxy-purple": "#8b5cf6",
        "star-white": "#E5E7EB"
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};
