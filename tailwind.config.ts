import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#08090c",
        panel: "#111319",
        line: "#282c35",
        signal: "#c8ff62",
        violet: "#a58bff",
        mist: "#a9aeba",
        coral: "#ff7566"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "Consolas", "Liberation Mono", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
