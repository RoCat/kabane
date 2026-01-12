import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';

class Notifications {
  private alert: SlAlert;

  public showToast: (message: string, type: 'success' | 'error') => void = (message, type) => {
    const alert = this.alert;
    alert.setAttribute('variant', type);
    alert.setAttribute('duration', '3000');
    alert.setAttribute('closable', '');
    const icon = document.createElement('sl-icon');
    icon.setAttribute('slot', 'icon');
    icon.setAttribute('name', type === 'success' ? 'check2-circle' : 'exclamation-octagon');
    alert.textContent = message;
    alert.appendChild(icon);
    void customElements.whenDefined('sl-alert').then(() => {
      alert.toast();
    });
  };

  constructor() {
    let alert = document.querySelector('sl-alert') as SlAlert;
    if (!alert) {
      alert = document.createElement('sl-alert') as SlAlert;
      document.body.appendChild(alert);
    }
    this.alert = alert;
  }
}

export const notifications = new Notifications();
