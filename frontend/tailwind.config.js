/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: {
          primary: '#111111',
          secondary: '#666666',
          muted: '#999999',
        },
        status: {
          verified: '#DCFCE7',
          verifiedText: '#166534',
          pending: '#FEF3C7',
          pendingText: '#92400E',
          rejected: '#FEE2E2',
          rejectedText: '#991B1B',
          expired: '#FFEDD5',
          expiredText: '#7C2D12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
