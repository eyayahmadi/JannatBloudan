# Module Expérience Sur Place

Ce module gère toutes les fonctionnalités liées à l'expérience sur place au restaurant.

## Composants

### Pages
- **ReservationPage**: Page de réservation de table avec plan de salle
- **MyReservationsPage**: Liste des réservations de l'utilisateur
- **TableSessionPage**: Session active pour une table (à implémenter)
- **QRMenuPage**: Menu accessible via QR code (à implémenter)

### Composants
- **ReservationForm**: Formulaire de réservation avec vérification de disponibilité
- **TableMap**: Plan de salle interactif avec statut en temps réel
- **TableSession**: Gestion de session de table active
- **PaymentModal**: Modal de paiement sur place (à implémenter)

### Services
- **dineInApi**: Service API pour toutes les requêtes backend

### Types
- Types TypeScript pour tous les modèles de données

## Fonctionnalités

### Réservation de Tables
- Vérification de disponibilité en temps réel
- Sélection de date, heure et nombre de personnes
- Suggestions d'horaires alternatifs
- Demandes spéciales
- Confirmation par email
- Rappels automatiques (backend)

### Plan de Salle
- Visualisation des tables disponibles
- Statuts en temps réel (Disponible, Occupée, Réservée, Maintenance)
- Filtrage par section/étage
- Sélection interactive de table

### Gestion Intelligente des Tables
- Session de table active
- Changement de table dynamique
- Historique des transferts
- Suivi de la durée

### Commande depuis la Table
- Scan QR code pour accéder au menu
- Commande en ligne depuis la table
- Ajout de plats pendant le repas
- Instructions spéciales

### Paiement Sur Place
- Demande d'addition digitale
- Paiement en ligne (carte)
- Paiement en espèces
- Paiement partagé (à implémenter)
- Gestion des pourboires

### Programme de Fidélité
- Points de fidélité
- Niveaux (Bronze, Silver, Gold, Platinum)
- Récompenses et avantages

## Intégration Backend

Toutes les requêtes passent par `dineInApi.ts` qui communique avec:
- `/api/v1/dine-in/*` endpoints

## À Implémenter

1. **QR Code Menu**
   - Génération de QR codes par table
   - Menu digital responsive
   - Commande sans contact

2. **Paiement Partagé**
   - Split bill
   - Paiement individuel par article
   - Calcul automatique des parts

3. **Notifications**
   - Notification quand table prête
   - Rappels de réservation (24h, 2h avant)
   - Confirmation de paiement

4. **Analytics**
   - Temps moyen par table
   - Taux de rotation des tables
   - Préférences de placement

5. **Intégration POS**
   - Synchronisation avec système de caisse
   - Impression de tickets
   - Gestion des imprimantes cuisine

## Configuration Requise

\`\`\`bash
# Variables d'environnement
REACT_APP_API_URL=http://localhost:8080/api/v1
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
\`\`\`
\`\`\`
