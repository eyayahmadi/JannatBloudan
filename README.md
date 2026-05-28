# Système de Gestion de Restaurant End-to-End

> **Application PFE (Next.js)** : parcours MVP / avancé / IA + chemins dans le code → voir **[`docs/PFE-PARCOURS.md`](docs/PFE-PARCOURS.md)**.

Template complet pour un système de gestion de restaurant moderne avec architecture microservices.

## Vue d'ensemble

Ce template fournit une solution complète pour gérer tous les aspects d'un restaurant:

- **Livraison à domicile**: Commande en ligne, paiement, tracking en temps réel
- **Expérience sur place**: Réservations, gestion des tables, paiement sur place
- **Administration**: Dashboard, stocks, analytics, gestion des employés
- **Événements**: Calendrier, réservations d'événements, rappels automatiques

## Architecture

### Frontend
- **Framework**: React 18+ avec TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + SWR
- **Build Tool**: Vite
- **UI Components**: Custom components + shadcn/ui

### Backend
- **Framework**: Spring Boot 3.2+
- **Architecture**: Microservices
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Message Queue**: RabbitMQ / AWS SQS
- **API Gateway**: Spring Cloud Gateway
- **Service Discovery**: Eureka
- **Authentication**: JWT + OAuth2

### Infrastructure
- **Cloud Provider**: AWS
- **Container**: Docker + ECS/EKS
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack / CloudWatch
- **CDN**: CloudFront

## Structure du projet

\`\`\`
restaurant-management-system/
├── frontend/                    # Application React
│   ├── src/
│   │   ├── modules/
│   │   │   ├── delivery/       # Module livraison
│   │   │   ├── dine-in/        # Module sur place
│   │   │   ├── admin/          # Module administration
│   │   │   └── events/         # Module événements
│   │   ├── components/         # Composants partagés
│   │   ├── services/           # API clients
│   │   ├── context/            # Context providers
│   │   └── config/             # Configuration
│   └── package.json
│
├── backend/                     # Microservices Spring Boot
│   ├── gateway-service/        # API Gateway
│   ├── auth-service/           # Authentification
│   ├── delivery-service/       # Service livraison
│   ├── dinein-service/         # Service sur place
│   ├── admin-service/          # Service administration
│   ├── events-service/         # Service événements
│   ├── notification-service/   # Notifications (email/SMS)
│   └── ai-service/             # Recommandations IA
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.sql
│   ├── API_ENDPOINTS.md
│   ├── AWS_INFRASTRUCTURE.yaml
│   └── DEPLOYMENT_GUIDE.md
│
├── terraform/                   # Infrastructure as Code
├── kubernetes/                  # Kubernetes manifests
└── docker-compose.yml          # Docker Compose pour dev local
\`\`\`

## Démarrage rapide

### Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- Java 17+

### Installation locale

1. **Cloner le repository**
\`\`\`bash
git clone https://github.com/votre-org/restaurant-management.git
cd restaurant-management
\`\`\`

2. **Configurer les variables d'environnement**
\`\`\`bash
cp .env.example .env
# Éditer .env avec vos configurations
\`\`\`

3. **Démarrer les services**
\`\`\`bash
docker-compose up -d
\`\`\`

4. **Installer les dépendances frontend**
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

5. **Accéder à l'application**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Eureka Dashboard: http://localhost:8761

## Modules principaux

### 1. Module Livraison à Domicile

**Fonctionnalités:**
- Catalogue de produits avec filtres intelligents
- Panier d'achat en temps réel
- Paiement sécurisé (Stripe)
- Tracking de commande en temps réel
- Historique des commandes
- Recommandations IA basées sur l'historique

**Technologies:**
- WebSocket pour le tracking temps réel
- Redis pour le cache du panier
- Stripe pour les paiements

### 2. Module Expérience Sur Place

**Fonctionnalités:**
- Système de réservation intelligent
- Plan de salle interactif
- Gestion des sessions de table
- Changement de table dynamique
- Paiement sur place (QR code)
- Rappels automatiques de réservation

**Technologies:**
- WebSocket pour les mises à jour temps réel des tables
- Notification service pour les rappels

### 3. Module Administration

**Fonctionnalités:**
- Dashboard analytique avec KPIs
- Gestion des stocks avec alertes
- Rapports de ventes
- Gestion des employés
- Analytics avancées
- Export de données

**Technologies:**
- Charts avec Recharts
- Export CSV/Excel
- Scheduled jobs pour les rapports

### 4. Module Gestion des Événements

**Fonctionnalités:**
- Calendrier d'événements interactif
- Gestion des réservations d'événements
- Rappels automatiques (confirmation, 24h avant, 3h avant)
- Types d'événements personnalisables
- Gestion de la capacité
- Paiement et remboursements

**Technologies:**
- Scheduled jobs pour les rappels
- Email/SMS via SendGrid/Twilio
- Calendar API

## Fonctionnalités IA

### Recommandations personnalisées
- Analyse de l'historique de commandes
- Suggestions basées sur les préférences
- Prédiction de la demande

### Optimisation
- Prix dynamiques
- Gestion intelligente des stocks
- Prévision de l'affluence

## API Documentation

Documentation complète des API disponible à:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI Spec: http://localhost:8080/v3/api-docs

Voir [API_ENDPOINTS.md](docs/API_ENDPOINTS.md) pour les détails.

## Base de données

Schema PostgreSQL complet disponible dans [DATABASE_SCHEMA.sql](docs/DATABASE_SCHEMA.sql)

**Tables principales:**
- users, roles, permissions
- restaurants, menu_items, categories
- orders, order_items
- tables, table_sessions, reservations
- events, event_bookings, event_reminders
- inventory, stock_movements

## Sécurité

- **Authentification**: JWT + OAuth2 (Google, Facebook)
- **Authorization**: RBAC (Role-Based Access Control)
- **Encryption**: TLS/SSL, données sensibles encryptées
- **Rate Limiting**: API rate limiting avec Redis
- **CORS**: Configuré pour les domaines autorisés
- **SQL Injection**: Protection via PreparedStatements
- **XSS**: Protection via sanitization

## Tests

### Backend
\`\`\`bash
cd backend/service-name
mvn test
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm test
\`\`\`

### Tests d'intégration
\`\`\`bash
npm run test:e2e
\`\`\`

## Déploiement

Voir [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) pour les instructions complètes.

### Déploiement sur AWS

\`\`\`bash
# Infrastructure
cd terraform/aws
terraform apply

# Application
./scripts/deploy-aws.sh production
\`\`\`

## Monitoring

- **Metrics**: Prometheus + Grafana
- **Logs**: ELK Stack / CloudWatch
- **Tracing**: Jaeger / AWS X-Ray
- **Alerts**: PagerDuty / Slack

## Contribution

1. Fork le projet
2. Créer une branche feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit les changements (\`git commit -m 'Add AmazingFeature'\`)
4. Push sur la branche (\`git push origin feature/AmazingFeature\`)
5. Ouvrir une Pull Request

## Licence

MIT License - voir le fichier [LICENSE](LICENSE)

## Support

- Documentation: [docs/](docs/)
- Issues: GitHub Issues
- Email: support@restaurant-system.com

## Roadmap

- [ ] Mobile apps (React Native)
- [ ] Intégration avec des POS systems
- [ ] Support multi-restaurants
- [ ] Loyalty program
- [ ] Advanced analytics avec ML
- [ ] Integration avec des services de livraison tiers
- [ ] Support multi-langues
- [ ] Accessibility improvements
\`\`\`
