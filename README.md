# Cookie Shop - Projet de vente de cookies

Projet e-commerce de vente de cookies avec :
- **Backend** : Java 17+ / Spring Boot 3
- **Frontend** : Angular 17+
- **Base de données** : PostgreSQL (ou H2 pour le développement)

---

## Structure du projet

```
projet-laura/
├── backend/                 # API Java Spring Boot
└── frontend/                # Application Angular
```

## Démarrer le projet

### Backend
```bash
cd backend
./mvnw spring-boot:run
```
API disponible sur : http://localhost:8080

### Frontend
```bash
cd frontend
npm install
ng serve
```
Application disponible sur : http://localhost:4200

---

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour les détails complets de l'architecture.
