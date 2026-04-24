# Module Gestion des Événements

## Vue d'ensemble

Ce module gère la planification, la réservation et le suivi des événements spéciaux du restaurant (mariages, anniversaires, événements d'entreprise, etc.).

## Fonctionnalités principales

### 1. Calendrier d'événements
- Vue mensuelle et hebdomadaire
- Visualisation interactive des événements
- Codes couleur par type d'événement
- Navigation intuitive entre les périodes

### 2. Gestion des événements
- Création d'événements avec détails complets
- Types d'événements personnalisables
- Gestion de la capacité et des réservations
- Statuts d'événements (brouillon, publié, complet, etc.)

### 3. Système de réservation
- Réservation en ligne pour les clients
- Sélection du nombre de participants
- Demandes spéciales
- Calcul automatique du prix total
- Paiement sécurisé intégré

### 4. Notifications automatiques
- Rappels de confirmation
- Rappel 24h avant l'événement
- Rappel 3h avant l'événement
- Système de notifications par email/SMS

## Structure des composants

\`\`\`
events/
├── types/
│   └── index.ts              # Types TypeScript
├── services/
│   └── eventsApi.ts          # API client
├── components/
│   ├── EventCalendar.tsx     # Calendrier interactif
│   ├── EventCard.tsx         # Carte d'événement
│   └── EventBookingModal.tsx # Modal de réservation
└── pages/
    ├── EventsListPage.tsx    # Liste publique des événements
    └── EventManagementPage.tsx # Gestion admin
\`\`\`

## API Endpoints requis (Spring Boot)

### Gestion des événements
- `GET /api/v1/restaurants/{id}/events` - Liste des événements
- `GET /api/v1/events/{id}` - Détails d'un événement
- `POST /api/v1/restaurants/{id}/events` - Créer un événement
- `PUT /api/v1/events/{id}` - Modifier un événement
- `DELETE /api/v1/events/{id}` - Supprimer un événement

### Réservations
- `GET /api/v1/events/{id}/bookings` - Liste des réservations
- `POST /api/v1/events/{id}/bookings` - Créer une réservation
- `PUT /api/v1/bookings/{id}/cancel` - Annuler une réservation
- `GET /api/v1/users/{id}/event-bookings` - Réservations d'un utilisateur

### Calendrier
- `GET /api/v1/restaurants/{id}/calendar` - Événements du calendrier

### Rappels
- `GET /api/v1/events/{id}/reminders` - Liste des rappels
- `POST /api/v1/bookings/{id}/reminders` - Planifier un rappel

### Analytics
- `GET /api/v1/restaurants/{id}/events/analytics` - Statistiques des événements

## Intégration avec le backend

### Configuration API
\`\`\`typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';
\`\`\`

### Authentification
Utilisez le token JWT dans les en-têtes:
\`\`\`typescript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
\`\`\`

## Fonctionnalités IA suggérées

1. **Recommandations d'événements**: Suggérer des événements basés sur l'historique
2. **Prix dynamique**: Ajuster les prix selon la demande
3. **Optimisation de la capacité**: Suggérer les meilleures configurations
4. **Analyse prédictive**: Prévoir la popularité des événements

## Système de rappels automatiques

Les rappels sont envoyés automatiquement selon le planning:
- **Confirmation**: Immédiatement après la réservation
- **24h avant**: Rappel de l'événement à venir
- **3h avant**: Rappel final

## Paiement sécurisé

Intégration Stripe pour:
- Paiement à la réservation
- Paiement fractionné possible
- Remboursements en cas d'annulation
- Historique des transactions

## Tests recommandés

1. Test de création d'événement
2. Test de réservation avec capacité
3. Test d'annulation et remboursement
4. Test d'envoi de rappels
5. Test de navigation du calendrier
