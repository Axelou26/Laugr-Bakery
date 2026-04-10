# Architecture du projet Cookie Shop

## Vue d'ensemble

```
┌─────────────────────┐         HTTP/REST          ┌─────────────────────┐
│   Angular (Front)   │  ◄──────────────────────►  │   Spring Boot (API) │
│   localhost:4200    │                            │   localhost:8080     │
└─────────────────────┘                            └─────────────────────┘
                                                               │
                                                               ▼
                                                    ┌─────────────────────┐
                                                    │   Base de données   │
                                                    │   H2 / PostgreSQL   │
                                                    └─────────────────────┘
```

---

## Backend (Java / Spring Boot)

### Structure des dossiers

```
backend/src/main/java/com/cookieshop/
├── CookieShopApplication.java
├── config/
│   ├── SecurityConfig.java      # Configuration Spring Security
│   └── DataInitializer.java     # Données de démo au démarrage
├── controller/
│   ├── CookieController.java    # API CRUD cookies
│   └── OrderController.java     # API commandes
├── dto/
│   ├── CookieDto.java
│   ├── CartItemDto.java
│   └── OrderDto.java
├── entity/
│   ├── Cookie.java
│   ├── User.java
│   ├── Order.java
│   └── OrderItem.java
├── repository/
│   ├── CookieRepository.java
│   ├── UserRepository.java
│   └── OrderRepository.java
└── service/
    ├── CookieService.java
    └── OrderService.java
```

### Modèle de données (Base de données)

```
users
├── id (PK)
├── first_name
├── last_name
├── email (unique)
├── password (hashé)
└── role

cookies
├── id (PK)
├── name
├── description
├── price
├── stock_quantity
├── image_url
└── available

orders
├── id (PK)
├── user_id (FK)
├── total_amount
├── status (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
├── created_at
└── shipping_address

order_items
├── id (PK)
├── order_id (FK)
├── cookie_id (FK)
├── quantity
└── unit_price
```

### Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/cookies` | Liste de tous les cookies |
| GET | `/api/cookies?availableOnly=true` | Cookies disponibles uniquement |
| GET | `/api/cookies/{id}` | Détail d'un cookie |
| POST | `/api/cookies` | Créer un cookie (admin) |
| PUT | `/api/cookies/{id}` | Modifier un cookie (admin) |
| DELETE | `/api/cookies/{id}` | Supprimer un cookie (admin) |
| POST | `/api/orders` | Créer une commande |
| GET | `/api/orders` | Liste des commandes de l'utilisateur |
| GET | `/api/orders/{id}` | Détail d'une commande |

### Exemple de requête POST `/api/orders`

```json
{
  "cartItems": [
    { "cookieId": 1, "quantity": 2 },
    { "cookieId": 2, "quantity": 1 }
  ],
  "shippingAddress": "123 rue des Cookies, 75001 Paris"
}
```

---

## Frontend (Angular)

### Structure des dossiers

```
frontend/src/
├── index.html
├── main.ts
├── styles.css
└── app/
    ├── app.component.ts
    ├── app.config.ts
    ├── app.routes.ts
    ├── models/
    │   └── cookie.model.ts       # Interfaces TypeScript
    ├── services/
    │   ├── cookie.service.ts     # Appels API cookies
    │   ├── cart.service.ts       # Gestion du panier (état local)
    │   └── order.service.ts      # Appels API commandes
    └── pages/
        ├── home/
        ├── cookies/              # Catalogue
        ├── cart/                 # Panier + checkout
        └── orders/               # Historique commandes
```

### Routes

| Path | Composant | Description |
|------|------------|-------------|
| `/` | HomeComponent | Page d'accueil |
| `/cookies` | CookiesComponent | Catalogue des cookies |
| `/panier` | CartComponent | Panier et passage de commande |
| `/commandes` | OrdersComponent | Historique des commandes |

### Flux utilisateur

1. **Navigation** : L'utilisateur parcourt le catalogue sur `/cookies`
2. **Panier** : Clic sur "Ajouter au panier" → `CartService` (signals)
3. **Checkout** : Sur `/panier`, modification des quantités, puis "Passer commande"
4. **Commande** : Saisie de l'adresse → appel `POST /api/orders` → panier vidé
5. **Historique** : Les commandes s'affichent sur `/commandes`

---

## Sécurité (à améliorer)

Actuellement :
- Spring Security est configuré en mode permissif (tous les endpoints sont ouverts)
- L'ID utilisateur est fixé à `1` en dur dans `OrderController`

À mettre en place :
1. **JWT** ou **sessions** pour l'authentification
2. Endpoint `POST /api/auth/login` et `POST /api/auth/register`
3. Récupérer le `userId` depuis le token/session au lieu d'un ID fixe
4. Protéger les endpoints admin (`POST/PUT/DELETE /api/cookies`)

---

## Déploiement en production

### Backend
- Utiliser PostgreSQL au lieu de H2
- Configurer `application-prod.yml` avec les vraies URLs et secrets
- Activer CORS pour le domaine du frontend

### Frontend
- `ng build --configuration production`
- Configurer l'URL de l'API (variable d'environnement)
- Déployer sur un hébergeur statique (Vercel, Netlify, etc.)
