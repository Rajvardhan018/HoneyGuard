/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        honey: {
          bg: "#f4f5fb",
          panel: "rgba(255, 255, 255, 0.78)",
          card: "#ffffff",
          indigo: "#210f47",
          purple: "#6d28d9",
          violet: "#8b5cf6",
          lavender: "#ede9fe",
          border: "rgba(237, 233, 254, 0.8)",
          text: "#1e1b4b",
          muted: "#64748b"
        },
        threat: {
          critical: "#ef4444",
          high: "#f59e0b",
          medium: "#8b5cf6",
          low: "#10b981"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(109, 40, 217, 0.07)',
        'glass-hover': '0 12px 40px 0 rgba(109, 40, 217, 0.12)',
        'glow-purple': '0 0 25px rgba(139, 92, 246, 0.35)',
        'glow-coral': '0 0 25px rgba(239, 68, 68, 0.35)',
      },
      backdropBlur: {
        'glass': '16px',
      }
    },
  },
  plugins: [],
}
