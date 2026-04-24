# Module Livraison à Domicile

Ce module gère toutes les fonctionnalités liées à la livraison à domicile.

## Composants

### Pages
- **MenuPage**: Page principale affichant le menu et le panier
- **OrderHistoryPage**: Historique des commandes de l'utilisateur
- **CheckoutPage**: Page de paiement et confirmation (à implémenter)

### Composants
- **MenuGrid**: Grille affichant tous les plats du menu avec filtres
- **MenuItemCard**: Carte individuelle pour chaque plat
- **MenuFilters**: Filtres pour rechercher et filtrer les plats
- **Cart**: Panier d'achat avec gestion des quantités
- **OrderTracking**: Suivi en temps réel de la commande

### Services
- **deliveryApi**: Service API pour toutes les requêtes backend

### Types
- Types TypeScript pour tous les modèles de données

## Fonctionnalités

### Catalogue de Produits
- Affichage du menu avec images
- Recherche et filtres (catégorie, prix, régime alimentaire)
- Informations nutritionnelles et allergènes
- Disponibilité en temps réel

### Panier Intelligent
- Ajout/suppression d'articles
- Modification des quantités
- Calcul automatique des totaux
- Persistance locale (à implémenter)

### Commande
- Sélection d'adresse de livraison
- Instructions spéciales
- Choix du mode de paiement
- Confirmation de commande

### Suivi de Commande
- Statuts en temps réel
- Timeline des événements
- Position du livreur (intégration maps à faire)
- Notifications push (à implémenter)

### Recommandations IA
- Suggestions basées sur l'historique
- Plats populaires
- Personnalisation des suggestions

## Intégration Backend

Toutes les requêtes passent par `deliveryApi.ts` qui communique avec:
- `/api/v1/delivery/*` endpoints

## À Implémenter

1. **Paiement Stripe**
   - Intégration Stripe Elements
   - Gestion des payment intents
   - Confirmation de paiement

2. **Notifications Push**
   - Web Push API
   - Notifications de statut de commande

3. **Géolocalisation**
   - Google Maps / Mapbox
   - Tracking en temps réel du livreur
   - Zones de livraison

4. **Persistance**
   - Sauvegarde du panier en localStorage
   - Synchronisation avec le backend

5. **Reviews & Ratings**
   - Système de notation
   - Commentaires et photos
   - Modération

## Configuration Requise

\`\`\`bash
# Variables d'environnement
REACT_APP_API_URL=http://localhost:8080/api/v1
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
REACT_APP_GOOGLE_MAPS_KEY=AIza...
\`\`\`
