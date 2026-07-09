// theme-toggle.js - Global theme management
document.addEventListener('DOMContentLoaded', function() {
  const html = document.documentElement;
  const toggleBtn = document.getElementById('theme-toggle');
  
  if (!toggleBtn) return;
  
  // Load saved theme
  let currentTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', currentTheme);
  updateToggleIcon(currentTheme);
  
  // Toggle handler
  toggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateToggleIcon(currentTheme);
  });
  
  function updateToggleIcon(theme) {
    const icon = toggleBtn.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
      toggleBtn.title = 'Switch to Light Mode';
    } else {
      icon.className = 'fas fa-moon';
      toggleBtn.title = 'Switch to Dark Mode';
    }
  }
});
