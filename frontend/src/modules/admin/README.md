# Module Administration

Ce module gère toutes les fonctionnalités d'administration du restaurant.

## Composants

### Pages
- **AdminDashboard**: Dashboard principal avec statistiques et graphiques
- **InventoryManagement**: Gestion complète des stocks
- **StaffManagement**: Gestion des employés (à implémenter)
- **ReservationsManagement**: Gestion des réservations (à implémenter)
- **SalesReports**: Rapports de ventes détaillés (à implémenter)

### Composants
- **DashboardStats**: Cartes de statistiques principales
- **RevenueChart**: Graphique d'évolution du chiffre d'affaires
- **InventoryTable**: Table de gestion des stocks
- **StaffTable**: Table de gestion du personnel (à implémenter)
- **ReservationCalendar**: Calendrier des réservations (à implémenter)

### Services
- **adminApi**: Service API pour toutes les requêtes backend

### Types
- Types TypeScript pour tous les modèles de données

## Fonctionnalités

### Dashboard Analytique
- Vue d'ensemble des performances
- Indicateurs clés (KPIs)
- Graphiques de revenus
- Articles les plus vendus
- Répartition des types de commandes
- Tendances et croissance

### Gestion des Stocks
- Liste complète de l'inventaire
- Alertes de stock bas
- Réapprovisionnement rapide
- Historique des transactions
- Gestion des fournisseurs
- Coût unitaire et valeur totale
- Export des données

### Gestion des Ventes
- Rapports détaillés
- Filtres par période
- Export CSV/PDF/Excel
- Analyse des tendances
- Comparaison périodes
- Prévisions (à implémenter avec IA)

### Gestion des Réservations
- Vue calendrier
- Confirmation/annulation
- Rappels automatiques
- Historique
- Statistiques de no-show
- Optimisation des tables

### Gestion du Personnel
- Liste des employés
- Horaires et planning
- Congés et absences
- Rôles et permissions
- Historique des performances
- Gestion des salaires

## Rôles et Permissions

### ADMIN
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs et permissions
- Configuration du système
- Accès aux rapports financiers

### MANAGER
- Gestion quotidienne
- Réservations et tables
- Personnel (consultation)
- Stocks et inventaire
- Rapports de vente

### STAFF
- Consultation des stocks
- Gestion des commandes
- Réservations (consultation)

## Intégration Backend

Toutes les requêtes passent par `adminApi.ts` qui communique avec:
- `/api/v1/admin/*` endpoints

## Sécurité

- Toutes les routes sont protégées par authentification JWT
- Vérification des rôles côté backend
- Logs d'audit pour toutes les actions sensibles
- Chiffrement des données sensibles (salaires, etc.)

## À Implémenter

1. **Analytics Avancés**
   - Prévisions de ventes avec IA
   - Analyse des tendances saisonnières
   - Recommandations d'optimisation
   - Tableaux de bord personnalisables

2. **Gestion du Personnel**
   - Planning automatique
   - Gestion des congés
   - Évaluation des performances
   - Formation et certifications

3. **Optimisation des Stocks**
   - Commandes automatiques
   - Prévisions de consommation
   - Gestion multi-fournisseurs
   - Intégration EDI

4. **Rapports Personnalisés**
   - Builder de rapports
   - Alertes personnalisées
   - Export automatique
   - Envoi par email

5. **Intégrations**
   - Systèmes comptables
   - Plateformes de paiement
   - CRM
   - Outils marketing

## Configuration Requise

\`\`\`bash
# Variables d'environnement
REACT_APP_API_URL=http://localhost:8080/api/v1
\`\`\`
\`\`\`
