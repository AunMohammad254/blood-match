import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          105: "#eff3f8",
          205: "#dbe3ec",
          250: "#ccd6e2",
          455: "#7c8ba1",
          650: "#3e4e68",
          655: "#3b485d",
          705: "#2f3d52",
          750: "#273549",
          805: "#1b2535",
          850: "#182235",
          855: "#0c1322",
        },
        red: {
          605: "#d32121",
          650: "#cb1c1c",
          750: "#a21515",
          955: "#3f0707",
        },
      },
    },
  },
  plugins: [],
};
export default config;
