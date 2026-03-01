/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        twitch: "#9146FF",
        "twitch-dark": "#772CE8",
        rarity: {
          common: "#d9d9d9",
          rare: "#4da6ff",
          epic: "#b266ff",
          legendary: "#ffd633",
          unique: "#ff66cc",
        },
      },
    },
  },
  plugins: [],
};
