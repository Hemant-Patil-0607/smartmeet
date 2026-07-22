/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          light: '#EEF2FF',
          dark: '#4F46E5',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        neutral: {
          DEFAULT: '#64748B',
          light: '#F1F5F9',
          dark: '#334155',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'heading-1': ['32px', { lineHeight: '40px' }],
        'heading-2': ['24px', { lineHeight: '32px' }],
        'heading-3': ['18px', { lineHeight: '28px' }],
        'body': ['14px', { lineHeight: '20px' }],
        'small': ['12px', { lineHeight: '16px' }],
      },
      fontWeight: {
        'heading-1': '700',
        'heading-2': '600',
        'heading-3': '600',
        'body': '400',
        'small': '400',
      },
    },
  },
  plugins: [],
};
