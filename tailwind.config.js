const plugin = require("tailwindcss/plugin");

module.exports = {
  darkMode: ["selector", '[zaui-theme="dark"]'],
  purge: {
    enabled: true,
    content: ["./src/**/*.{js,jsx,ts,tsx,vue}"],
  },
  theme: {
    extend: {
      fontFamily: {
        mono: ["Roboto Mono", "monospace"],
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-hide": {
          /* Firefox */
          "scrollbar-width": "none",
          /* Safari and Chrome (WebKit) */
          "&::-webkit-scrollbar": {
            display: "none",
          },
          /* IE and Edge */
          "-ms-overflow-style": "none",
        },
        ".scrollbar-default": {
          "scrollbar-width": "auto",
          "&::-webkit-scrollbar": {
            display: "block",
          },
          "-ms-overflow-style": "auto",
        },
      });
    }),
  ],
};
