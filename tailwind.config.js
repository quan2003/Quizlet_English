/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        quiz: {
          blue: "#4255ff",
          ink: "#20233a",
          muted: "#626983",
          line: "#dde2f0",
          bg: "#f6f7fb"
        }
      },
      borderRadius: {
        card: "8px"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(36, 43, 79, 0.12)"
      }
    }
  },
  plugins: []
};
