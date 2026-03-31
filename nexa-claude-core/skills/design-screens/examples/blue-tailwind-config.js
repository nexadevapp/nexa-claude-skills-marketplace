/* Blue theme — Tailwind CSS CDN configuration */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        forest: { 50:'#eef0ff', 100:'#dde2ff', 200:'#bbc4ff', 300:'#8a99ff', 400:'#5a6eff', 500:'#3a50ff', 600:'#1D34FF', 700:'#1D34FF', 800:'#0f1a80', 900:'#0a1159' },
        coral: { 50:'#e8ebff', 100:'#d0d6ff', 200:'#a1adff', 300:'#7184ff', 400:'#4a5eff', 500:'#1D34FF', 600:'#1729d9', 700:'#111fb3', 800:'#0c168c', 900:'#080e66' },
        cream: { 50:'#fafaff', 100:'#f2f3ff', 200:'#e8eaff', 300:'#dcdeff', 400:'#c8cbeb' },
        gold: { 50:'#f0f2ff', 100:'#dde2ff', 200:'#bbc4ff', 300:'#8a99ff', 400:'#6b7cff', 500:'#4a5eff', 600:'#3a50ff', 700:'#2940e6', 800:'#1D34FF', 900:'#0f1a80' },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Lora', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
}
