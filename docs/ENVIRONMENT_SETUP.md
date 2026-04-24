# Configuration des Variables d'Environnement

Ce guide explique comment configurer les variables d'environnement nécessaires pour le système de gestion de restaurant.

## Variables Backend (Spring Boot)

Créer un fichier `.env` dans le répertoire `backend/`:

\`\`\`env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_min_256_bits

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=restaurant-assets

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@restaurant.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+33123456789
\`\`\`

## Variables Frontend (Next.js)

### Dans v0

Pour configurer les variables d'environnement dans v0:

1. **Ouvrir le panneau de configuration**
   - Cliquer sur l'icône de la barre latérale dans le chat
   - Sélectionner "Vars" dans le menu

2. **Ajouter les variables suivantes:**

#### Variables API (Requises)
\`\`\`
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
\`\`\`

#### Variables Stripe (Requises pour les paiements)
\`\`\`
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_publishable_key
\`\`\`

#### Variables Google Maps (Optionnelles)
\`\`\`
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
\`\`\`

### Dans votre environnement local

Créer un fichier `.env.local` à la racine du projet frontend:

\`\`\`env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_publishable_key

# Google Maps (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
\`\`\`

### En production

Pour déployer sur Vercel:

1. Aller dans les paramètres du projet Vercel
2. Naviguer vers "Environment Variables"
3. Ajouter toutes les variables `NEXT_PUBLIC_*`
4. Redéployer l'application

## Obtention des clés API

### Stripe

1. Aller sur https://dashboard.stripe.com/
2. Créer un compte ou se connecter
3. Aller dans "Developers" → "API keys"
4. Copier la "Publishable key" (commence par `pk_test_`)
5. Copier la "Secret key" (commence par `sk_test_`)

**Note:** Utilisez les clés de test pour le développement, les clés de production pour la production.

### Google Maps API

1. Aller sur https://console.cloud.google.com/
2. Créer un nouveau projet
3. Activer les APIs suivantes:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Aller dans "Credentials"
5. Créer une clé API
6. Restreindre la clé aux domaines autorisés

**Important:** Pour la sécurité, restreignez l'utilisation de la clé API:
- Limiter aux domaines de votre application
- Limiter aux APIs spécifiques
- Définir des quotas d'utilisation

### Google OAuth (Optionnel pour login social)

1. Aller sur https://console.cloud.google.com/
2. Dans le même projet, aller dans "OAuth consent screen"
3. Configurer l'écran de consentement
4. Aller dans "Credentials" → "Create Credentials" → "OAuth client ID"
5. Sélectionner "Web application"
6. Ajouter les URLs autorisées:
   - `http://localhost:3000` (développement)
   - `https://votre-domaine.com` (production)
7. Copier le Client ID et Client Secret

## Vérification de la configuration

### Backend

Vérifier que toutes les variables sont chargées:

\`\`\`bash
cd backend
mvn spring-boot:run
# Vérifier les logs pour voir si les services démarrent correctement
\`\`\`

### Frontend

Vérifier que les variables sont accessibles:

\`\`\`bash
cd frontend
npm run dev
# Ouvrir http://localhost:3000 et vérifier la console
\`\`\`

Dans la console du navigateur, vous pouvez vérifier:
\`\`\`javascript
console.log(process.env.NEXT_PUBLIC_API_BASE_URL);
// Devrait afficher: http://localhost:8080/api/v1
\`\`\`

## Sécurité

### ⚠️ Important

- **JAMAIS** commiter les fichiers `.env` ou `.env.local` dans Git
- Ajouter ces fichiers dans `.gitignore`
- Utiliser des clés de test en développement
- Utiliser des clés de production uniquement en production
- Restreindre les clés API aux domaines autorisés
- Utiliser des secrets managers en production (AWS Secrets Manager, etc.)

### Variables sensibles

Les variables suivantes sont sensibles et ne doivent JAMAIS être exposées au client:

- `JWT_SECRET`
- `DB_PASSWORD`
- `STRIPE_SECRET_KEY` (seule la publishable key peut être exposée)
- `AWS_SECRET_ACCESS_KEY`
- `SENDGRID_API_KEY`
- `TWILIO_AUTH_TOKEN`
- `GOOGLE_CLIENT_SECRET`

### Variables publiques

Les variables suivantes sont sûres à exposer au client (préfixées par `NEXT_PUBLIC_`):

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (avec restrictions appropriées)

## Troubleshooting

### Les variables ne sont pas chargées

1. Vérifier que le fichier `.env.local` est à la racine du projet
2. Redémarrer le serveur de développement
3. Vérifier l'orthographe des noms de variables
4. S'assurer que les variables commencent par `NEXT_PUBLIC_` pour être accessibles côté client

### Erreurs de connexion API

1. Vérifier que le backend est démarré sur le bon port
2. Vérifier `NEXT_PUBLIC_API_BASE_URL` pointe vers le bon endpoint
3. Vérifier les CORS dans la configuration Spring Boot

### Erreurs Stripe

1. Vérifier que vous utilisez les bonnes clés (test vs production)
2. Vérifier que la clé commence par `pk_test_` ou `pk_live_`
3. Vérifier les webhooks sont configurés correctement

## Support

Pour plus d'aide:
- Documentation Next.js: https://nextjs.org/docs/basic-features/environment-variables
- Documentation Stripe: https://stripe.com/docs/keys
- Documentation Google Cloud: https://cloud.google.com/docs
\`\`\`
\`\`\`
