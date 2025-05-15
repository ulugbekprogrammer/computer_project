document.addEventListener("DOMContentLoaded", () => {
  const darkModeToggle = document.getElementById("darkModeToggle")

  // Check for saved dark mode preference or use system preference
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)")
  const storedTheme = localStorage.getItem("theme")

  if (storedTheme === "dark" || (!storedTheme && prefersDarkScheme.matches)) {
    document.body.classList.add("dark-mode")
    darkModeToggle.checked = true
  }

  // Toggle dark mode
  darkModeToggle.addEventListener("change", function () {
    if (this.checked) {
      document.body.classList.add("dark-mode")
      localStorage.setItem("theme", "dark")
    } else {
      document.body.classList.remove("dark-mode")
      localStorage.setItem("theme", "light")
    }
  })
})
