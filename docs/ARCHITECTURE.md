# Restaurant Management System - Architecture Documentation

## Vue d'ensemble

Système de gestion de restaurant end-to-end basé sur une architecture microservices avec React frontend et Spring Boot backend.

## Architecture Microservices

### Services Backend (Spring Boot)

\`\`\`
restaurant-management/
├── api-gateway/                 # API Gateway (Spring Cloud Gateway)
├── service-discovery/           # Eureka Server
├── config-server/              # Spring Cloud Config
├── auth-service/               # Authentication & Authorization
├── delivery-service/           # Module Livraison
├── dine-in-service/           # Module Sur Place
├── admin-service/             # Module Administration
├── event-service/             # Module Événements
├── notification-service/      # Service de Notifications
├── payment-service/           # Service de Paiement
├── ai-recommendation-service/ # Service IA
└── shared-library/            # Librairies partagées
\`\`\`

### Frontend (React)

\`\`\`
restaurant-frontend/
├── public/
├── src/
│   ├── modules/
│   │   ├── delivery/          # Module Livraison
│   │   ├── dine-in/          # Module Sur Place
│   │   ├── admin/            # Module Administration
│   │   └── events/           # Module Événements
│   ├── shared/
│   │   ├── components/       # Composants réutilisables
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── utils/           # Utilitaires
│   │   └── types/           # Types TypeScript
│   ├── store/               # Redux store
│   └── App.tsx
\`\`\`

## Stack Technique

### Backend
- **Framework**: Spring Boot 3.2
- **API Gateway**: Spring Cloud Gateway
- **Service Discovery**: Eureka
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Security**: Spring Security + JWT
- **Documentation**: Swagger/OpenAPI 3.0

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Routing**: React Router v6
- **UI Components**: Custom components + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **API Client**: Axios + React Query

### DevOps & Infrastructure (AWS)
- **Compute**: ECS Fargate
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Storage**: S3
- **CDN**: CloudFront
- **Load Balancer**: ALB
- **CI/CD**: GitHub Actions + AWS CodePipeline
- **Monitoring**: CloudWatch + Prometheus + Grafana
- **Container Registry**: ECR

### IA & Analytics
- **Recommandations**: Amazon Personalize
- **Analytics**: Amazon QuickSight
- **ML Pipeline**: SageMaker

## Modules Fonctionnels

### 1. Module Livraison à Domicile
- Création de compte client
- Catalogue de produits avec recherche et filtres
- Panier intelligent
- Système de commande
- Paiement sécurisé (Stripe/PayPal)
- Suivi de commande en temps réel
- Système de notation et avis
- Recommandations IA basées sur l'historique

### 2. Module Expérience Sur Place
- Réservation de tables
- Gestion intelligente des tables
- Menu digital avec QR code
- Commande depuis la table
- Changement de table dynamique
- Paiement en ligne sur place
- Programme de fidélité

### 3. Module Administration
- Dashboard analytique
- Gestion des stocks (alertes automatiques)
- Gestion des ventes et rapports
- Gestion des réservations
- Rappels automatiques
- Gestion des employés
- Configuration du restaurant

### 4. Module Gestion des Événements
- Calendrier des événements
- Création et gestion d'événements
- Réservation d'événements
- Gestion des participants
- Facturation d'événements
- Marketing d'événements

## Schéma de Base de Données

Voir `docs/DATABASE_SCHEMA.sql`

## APIs

Voir `docs/API_ENDPOINTS.md`

## Sécurité

### Authentication Flow
1. Client envoie credentials à `/api/auth/login`
2. Auth Service valide et génère JWT
3. JWT inclut: userId, roles, permissions, exp
4. Toutes les requêtes incluent `Authorization: Bearer {token}`
5. API Gateway valide JWT avant de router

### Authorization
- **Role-based**: ADMIN, MANAGER, STAFF, CUSTOMER
- **Permission-based**: Granular permissions par module

## Intégration Continue/Déploiement Continu

\`\`\`yaml
# Pipeline CI/CD
stages:
  - test
  - build
  - deploy-staging
  - deploy-production

# Environnements
- Development: Auto-deploy on merge to develop
- Staging: Auto-deploy on merge to staging
- Production: Manual approval required
\`\`\`

## Monitoring & Observabilité

- **Logs**: Centralisés dans CloudWatch
- **Metrics**: Prometheus + Grafana
- **Tracing**: AWS X-Ray
- **Alerting**: CloudWatch Alarms + SNS

## Scalabilité

- **Auto-scaling**: Basé sur CPU et mémoire
- **Database**: Read replicas pour la lecture
- **Cache**: Redis pour les données fréquemment accédées
- **CDN**: CloudFront pour les assets statiques

## Sécurité & Conformité

- HTTPS obligatoire
- Encryption at rest (S3, RDS)
- Encryption in transit (TLS 1.3)
- Regular security audits
- GDPR compliance
- PCI DSS compliance (paiements)
