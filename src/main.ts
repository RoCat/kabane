/**
 * Kabane - Tickets as Code
 *
 * Main entry point for the application.
 * This file imports the main component and initializes any global setup.
 */

// Import main application component
// This registers the <kabane-app> custom element
import './components/kabane-app';

// Log startup (development only)
if (import.meta.env.DEV) {
  console.log('🎫 Kabane - Tickets as Code');
  console.log('Version:', import.meta.env.VITE_APP_VERSION || 'development');
}
