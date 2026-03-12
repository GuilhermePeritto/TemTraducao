import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 84% 4.9%)",
        card: "hsl(0 0% 100%)",
        "card-foreground": "hsl(222.2 84% 4.9%)",
        popover: "hsl(0 0% 100%)",
        "popover-foreground": "hsl(222.2 84% 4.9%)",
        primary: "hsl(221.2 83.2% 53.3%)",
        "primary-foreground": "hsl(210 40% 98%)",
        secondary: "hsl(210 40% 96.1%)",
        "secondary-foreground": "hsl(222.2 47.4% 11.2%)",
        muted: "hsl(210 40% 96.1%)",
        "muted-foreground": "hsl(215.4 16.3% 46.9%)",
        accent: "hsl(210 40% 96.1%)",
        "accent-foreground": "hsl(222.2 47.4% 11.2%)",
        border: "hsl(214.3 31.8% 91.4%)",
        input: "hsl(214.3 31.8% 91.4%)",
        ring: "hsl(221.2 83.2% 53.3%)",
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      boxShadow: {
        glow: "0 20px 60px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "vercel-grid":
          "radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.06), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
