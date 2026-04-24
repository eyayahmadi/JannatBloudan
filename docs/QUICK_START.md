# Guide de Démarrage Rapide

Ce guide vous aidera à démarrer rapidement avec le système de gestion de restaurant.

## Prérequis

- Docker Desktop installé
- Node.js 18+ installé
- Git installé

## Option 1: Démarrage avec Docker (Recommandé)

### 1. Cloner le repository

\`\`\`bash
git clone https://github.com/votre-org/restaurant-management.git
cd restaurant-management
\`\`\`

### 2. Configurer les variables d'environnement

\`\`\`bash
cp .env.example .env
# Éditer .env avec vos configurations
\`\`\`

### 3. Démarrer avec Docker Compose

\`\`\`bash
docker-compose up -d
\`\`\`

### 4. Accéder à l'application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Eureka Dashboard**: http://localhost:8761

## Option 2: Démarrage dans v0

Si vous utilisez ce template dans v0, les modules React sont prêts à être testés.

### Configuration dans v0

1. **Ouvrir la barre latérale** dans le chat v0
2. **Aller dans "Vars"**
3. **Ajouter ces variables:**

\`\`\`
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_votre_cle_stripe
\`\`\`

### Tester les modules

L'application affiche 4 modules que vous pouvez explorer:

1. **Livraison à Domicile** - Commande en ligne
2. **Expérience Sur Place** - Réservations et tables
3. **Administration** - Dashboard et gestion
4. **Événements** - Calendrier et réservations d'événements

## Option 3: Développement Local

### Backend (Spring Boot)

\`\`\`bash
cd backend

# Démarrer PostgreSQL et Redis
docker-compose up -d postgres redis

# Compiler et démarrer chaque service
cd gateway-service
mvn spring-boot:run

# Dans un nouveau terminal
cd auth-service
mvn spring-boot:run

# Répéter pour les autres services
\`\`\`

### Frontend (React)

\`\`\`bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
\`\`\`

Ouvrir http://localhost:3000

## Premiers pas

### 1. Explorer la page d'accueil

La page d'accueil présente les 4 modules du système avec leurs fonctionnalités.

### 2. Tester le module Livraison

- Cliquer sur "Voir le module" du module Livraison
- Explorer le catalogue de produits
- Ajouter des articles au panier
- Voir le tracking de commande

### 3. Tester le module Sur Place

- Créer une réservation
- Voir le plan de salle
- Gérer une session de table

### 4. Tester le module Admin

- Voir le dashboard avec les KPIs
- Gérer l'inventaire
- Voir les rapports de ventes

### 5. Tester le module Événements

- Voir le calendrier d'événements
- Créer un nouvel événement
- Gérer les réservations

## Architecture

Le système utilise une architecture microservices:

\`\`\`
Frontend (React) → API Gateway → Microservices
                                  ├── Auth Service
                                  ├── Delivery Service
                                  ├── Dine-In Service
                                  ├── Admin Service
                                  └── Events Service
\`\`\`

## Données de test

Pour tester rapidement, utilisez ces comptes:

**Admin:**
- Email: admin@restaurant.com
- Password: Admin123!

**Client:**
- Email: client@example.com
- Password: Client123!

**Staff:**
- Email: staff@restaurant.com
- Password: Staff123!

## Prochaines étapes

1. **Lire la documentation complète** dans `docs/`
2. **Configurer les intégrations** (Stripe, Google Maps, etc.)
3. **Personnaliser le design** selon vos besoins
4. **Ajouter vos propres fonctionnalités**
5. **Déployer sur AWS** en suivant le guide de déploiement

## Ressources

- [Architecture complète](./ARCHITECTURE.md)
- [Schéma de base de données](./DATABASE_SCHEMA.sql)
- [Documentation API](./API_ENDPOINTS.md)
- [Configuration environnement](./ENVIRONMENT_SETUP.md)
- [Guide de déploiement](./DEPLOYMENT_GUIDE.md)

## Besoin d'aide?

- Vérifier la [documentation](./README.md)
- Ouvrir une issue sur GitHub
- Contacter le support

Bonne chance avec votre projet de gestion de restaurant! 🍽️
\`\`\`
\`\`\`
