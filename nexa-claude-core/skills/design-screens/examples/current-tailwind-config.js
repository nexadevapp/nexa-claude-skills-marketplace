/* ===================================================================
   VoluntX Tailwind Theme — Currently: GREEN
   To switch themes, replace this file's contents with the desired theme:
     - blue-tailwind-config.js  (Blue/Indigo)
     - green-tailwind-config.js (Green/Forest)
   Also update current-theme.css to match.
   =================================================================== */

tailwind.config = {
  theme: {
    extend: {
      colors: {
        forest: { 50:'#ecfdf5', 100:'#d1fae5', 200:'#a7f3d0', 300:'#6ee7b7', 400:'#34d399', 500:'#10b981', 600:'#059669', 700:'#047857', 800:'#065f46', 900:'#064e3b' },
        coral: { 50:'#fff7ed', 100:'#ffedd5', 200:'#fed7aa', 300:'#fdba74', 400:'#fb923c', 500:'#f97316', 600:'#ea580c', 700:'#c2410c', 800:'#9a3412', 900:'#7c2d12' },
        cream: { 50:'#f8faf9', 100:'#f0f5f2', 200:'#e4ece7', 300:'#d5e0d9', 400:'#b8c5bd' },
        gold: { 50:'#fefce8', 100:'#fef9c3', 200:'#fef08a', 300:'#fde047', 400:'#facc15', 500:'#eab308', 600:'#ca8a04', 700:'#a16207', 800:'#854d0e', 900:'#713f12' },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Lora', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
}
