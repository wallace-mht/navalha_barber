import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        noite: "#0c1d16",
        floresta: "#1f3d32",
        offwhite: "#faf7f1",
        nevoa: "#b9c7bf",
        brasa: "#e6be8c",
      },
      borderRadius: {
        painel: "2rem",
        cartao: "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
