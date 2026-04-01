/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // 主色调：莫兰迪色系
        rose: {
          light: '#E8C5C5',
          DEFAULT: '#D4A5A5', // 干枯玫瑰粉
          dark: '#B88282',
        },
        blue: {
          light: '#C4D0E0',
          DEFAULT: '#A8B5C8', // 雾霾蓝
          dark: '#7A8BA3',
        },
        olive: {
          light: '#D4D4BF',
          DEFAULT: '#B8B89F', // 橄榄绿
          dark: '#8A8A77',
        },
        // 背景色
        paper: {
          DEFAULT: '#FAF7F2', // 米白色
          warm: '#F5E6D3', // 暖杏色
          green: '#E8F0E8', // 淡鼠尾草绿
        },
        // 点缀色
        accent: {
          pink: '#F8D8D8', // 浅粉
          yellow: '#FCE8B2', // 鹅黄
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Helvetica Neue', 'Arial', 'sans-serif'], // 无衬线体
        serif: ['Source Han Serif SC', 'Noto Serif SC', 'SimSun', 'serif'], // 衬线体
        handwriting: ['"Ma Shan Zheng"', '"Zhi Mang Xing"', 'cursive'], // 预留手写体位置
      },
      boxShadow: {
        'paper': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'paper-texture': "url('/textures/paper.png')",
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      }
    },
  },
  plugins: [],
};
