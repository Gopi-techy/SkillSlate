import './styles.css';
import { SkillSlateApp } from './app.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  const app = new SkillSlateApp();
  window.skillSlateApp = app;
  window.app = app; // For global access
  await app.init();
});
