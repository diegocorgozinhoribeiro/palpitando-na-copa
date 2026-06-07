import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Azul e a cor principal (marca Palpitando na Copa)
        brand: {
          DEFAULT: "#1d4ed8",
          dark: "#1e3a8a",
          light: "#e8eefc",
        },
        // Detalhes minimos: amarelo (destaque) e vermelho (alertas)
        accent: "#f5c518",
        danger: "#dc2626",
        // Cores funcionais dos cards de palpite (sim/nao)
        sim: "#16a34a",
        nao: "#dc2626",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
