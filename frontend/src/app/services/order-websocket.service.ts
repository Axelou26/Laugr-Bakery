import { Injectable, inject } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';

type SockJsConstructor = new (url: string, _reserved?: null, options?: Record<string, unknown>) => WebSocket;

@Injectable({ providedIn: 'root' })
export class OrderWebSocketService {
  private client: Client | null = null;
  private lastToken: string | null = null;

  private auth = inject(AuthService);
  private toast = inject(ToastService);

  /**
   * À appeler depuis un effect dans un composant (ex. AppComponent), pas depuis le constructeur du service.
   */
  syncSession(token: string | null, isLoggedIn: boolean): void {
    if (!isLoggedIn || !token) {
      this.lastToken = null;
      this.disconnect();
      return;
    }
    if (this.lastToken === token && this.client?.active) {
      return;
    }
    this.lastToken = token;
    this.disconnect();
    this.connect(token);
  }

  private connect(token: string) {
    const tokenAtStart = token;
    void import('sockjs-client')
      .then((sockMod) => {
        if (this.lastToken !== tokenAtStart) {
          return;
        }
        const SockJS = (sockMod as { default?: SockJsConstructor }).default ?? (sockMod as unknown as SockJsConstructor);
        const url = `${environment.apiUrl}/ws?token=${encodeURIComponent(tokenAtStart)}`;
        const client = new Client({
          webSocketFactory: () => new SockJS(url) as unknown as WebSocket,
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            if (this.lastToken !== tokenAtStart) {
              return;
            }
            if (this.auth.isAdmin()) {
              client.subscribe('/topic/admin/orders', (msg: IMessage) => {
                try {
                  const data = JSON.parse(msg.body) as {
                    orderId: number;
                    customerName?: string;
                    totalAmount?: number;
                  };
                  const amount =
                    data.totalAmount != null ? Number(data.totalAmount).toFixed(2) : '—';
                  const name = data.customerName?.trim() || 'Client';
                  this.toast.info(`Nouvelle commande #${data.orderId} — ${name} (${amount} €)`);
                } catch {
                  this.toast.info('Nouvelle commande reçue');
                }
              });
            }
            client.subscribe('/user/queue/order-status', (msg: IMessage) => {
              try {
                const data = JSON.parse(msg.body) as { orderId: number; status: string };
                const label = this.statusLabel(data.status);
                this.toast.info(`Commande #${data.orderId} : ${label}`);
              } catch {
                this.toast.info('Mise à jour de commande');
              }
            });
          },
          onStompError: () => {
            /* éviter le spam */
          }
        });
        client.activate();
        this.client = client;
      })
      .catch((err) => console.error('[OrderWebSocket] chargement SockJS impossible', err));
  }

  private disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  private statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée'
    };
    return map[status] ?? status;
  }
}
