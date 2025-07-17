/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // New primary palette - Thistle (purple-pink)
        primary: {
          50: '#f8f3f9',
          100: '#f2e8f4',
          200: '#ebdcee',
          300: '#e4d0e8',
          400: '#dec5e3',
          500: '#dec5e3', // Main thistle color
          600: '#bd8bc7',
          700: '#9d53ab',
          800: '#683772',
          900: '#341c39',
        },
        // Columbia Blue
        columbia: {
          50: '#f5fbff',
          100: '#ebf8fe',
          200: '#e2f4fe',
          300: '#d8f1fd',
          400: '#cdedfd',
          500: '#cdedfd', // Main columbia blue
          600: '#76cdf9',
          700: '#1eaef6',
          800: '#0778b0',
          900: '#043c58',
        },
        // Uranian Blue
        uranian: {
          50: '#f0f8ff',
          100: '#e1f1ff',
          200: '#d2eafe',
          300: '#c3e2fe',
          400: '#b6dcfe',
          500: '#b6dcfe', // Main uranian blue
          600: '#5eb3fd',
          700: '#098afb',
          800: '#035cab',
          900: '#012e55',
        },
        // Celeste (cyan-blue)
        celeste: {
          50: '#edfefe',
          100: '#dcfcfd',
          200: '#cafbfd',
          300: '#b9f9fc',
          400: '#a9f8fb',
          500: '#a9f8fb', // Main celeste
          600: '#57f2f7',
          700: '#0be8f0',
          800: '#089ba0',
          900: '#044d50',
        },
        // Fluorescent Cyan
        fluorescent: {
          50: '#e6fdfa',
          100: '#cdfcf5',
          200: '#b4faf0',
          300: '#9bf9eb',
          400: '#81f7e5',
          500: '#81f7e5', // Main fluorescent cyan
          600: '#3bf3d7',
          700: '#0ed5b7',
          800: '#098e7a',
          900: '#05473d',
        },
        // Keep some original colors for compatibility
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-in': 'slideIn 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'bounce-subtle': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        slideIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        scaleIn: {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)'
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)'
          }
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}