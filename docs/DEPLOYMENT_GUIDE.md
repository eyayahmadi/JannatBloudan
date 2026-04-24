# Guide de Déploiement - Système de Gestion de Restaurant

## Architecture de déploiement

### Services Docker
Tous les services sont conteneurisés avec Docker et orchestrés via Docker Compose ou Kubernetes.

## Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (pour le développement local)
- Java 17+ (pour le développement local)
- PostgreSQL 14+ (ou via Docker)
- Redis 7+ (ou via Docker)

## Déploiement Local

### 1. Configuration des variables d'environnement

Créer un fichier `.env` à la racine:

\`\`\`env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=restaurant_db
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_min_256_bits

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=restaurant-assets

# Email (SendGrid/SES)
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@restaurant.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+33123456789
\`\`\`

### 2. Lancer avec Docker Compose

\`\`\`bash
# Construire les images
docker-compose build

# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Arrêter tous les services
docker-compose down
\`\`\`

### 3. Accès aux services

- Frontend: http://localhost:3000
- Gateway API: http://localhost:8080
- Eureka Dashboard: http://localhost:8761
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## Déploiement AWS

### Architecture AWS

1. **VPC**: Réseau privé isolé
2. **ECS/EKS**: Orchestration des conteneurs
3. **RDS PostgreSQL**: Base de données managée
4. **ElastiCache Redis**: Cache managé
5. **S3**: Stockage des assets
6. **CloudFront**: CDN pour le frontend
7. **ALB**: Load balancer
8. **Route53**: DNS
9. **CloudWatch**: Monitoring
10. **SES**: Email
11. **SNS**: Notifications

### Étapes de déploiement

#### 1. Infrastructure as Code (Terraform)

\`\`\`bash
cd terraform/aws
terraform init
terraform plan
terraform apply
\`\`\`

#### 2. Configuration ECS/EKS

\`\`\`bash
# Construire et pousser les images vers ECR
./scripts/build-and-push.sh

# Déployer sur ECS
aws ecs update-service --cluster restaurant-cluster --service gateway-service --force-new-deployment

# Ou déployer sur EKS
kubectl apply -f kubernetes/
\`\`\`

#### 3. Configuration RDS

\`\`\`bash
# Créer la base de données
aws rds create-db-instance \
  --db-instance-identifier restaurant-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.7 \
  --master-username admin \
  --master-user-password <password> \
  --allocated-storage 100
\`\`\`

#### 4. Configuration S3 et CloudFront

\`\`\`bash
# Créer le bucket S3
aws s3 mb s3://restaurant-frontend

# Déployer le frontend
cd frontend
npm run build
aws s3 sync build/ s3://restaurant-frontend

# Invalider le cache CloudFront
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
\`\`\`

## CI/CD avec GitHub Actions

### Workflow pour le Backend

\`\`\`yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Build with Maven
        run: mvn clean package -DskipTests
        working-directory: ./backend
      
      - name: Run tests
        run: mvn test
        working-directory: ./backend
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-west-1.amazonaws.com
          docker-compose push
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster restaurant-cluster --service gateway-service --force-new-deployment
\`\`\`

### Workflow pour le Frontend

\`\`\`yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
      
      - name: Run tests
        run: npm test
        working-directory: ./frontend
      
      - name: Build
        run: npm run build
        working-directory: ./frontend
        env:
          REACT_APP_API_BASE_URL: https://api.restaurant.com/api/v1
      
      - name: Deploy to S3
        run: aws s3 sync build/ s3://restaurant-frontend
        working-directory: ./frontend
      
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
\`\`\`

## Monitoring et Logging

### Configuration Prometheus

\`\`\`yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'spring-actuator'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['gateway-service:8080', 'auth-service:8081']
\`\`\`

### Configuration Grafana

Importer les dashboards prédéfinis:
- Spring Boot Dashboard (ID: 12900)
- JVM Dashboard (ID: 4701)
- PostgreSQL Dashboard (ID: 9628)

### CloudWatch Logs

Tous les services envoient leurs logs vers CloudWatch:
- Log Group: /ecs/restaurant-system
- Rétention: 30 jours
- Alarmes configurées pour les erreurs critiques

## Sécurité

### Certificats SSL/TLS

\`\`\`bash
# Utiliser AWS Certificate Manager
aws acm request-certificate \
  --domain-name restaurant.com \
  --subject-alternative-names *.restaurant.com \
  --validation-method DNS
\`\`\`

### Secrets Management

Utiliser AWS Secrets Manager:
\`\`\`bash
aws secretsmanager create-secret \
  --name restaurant/prod/db \
  --secret-string '{"username":"admin","password":"<password>"}'
\`\`\`

### WAF Configuration

Activer AWS WAF avec règles:
- Rate limiting
- SQL injection protection
- XSS protection
- Geo-blocking si nécessaire

## Backup et Disaster Recovery

### RDS Automated Backups

- Backup quotidien automatique
- Rétention: 7 jours
- Point-in-time recovery activé

### S3 Versioning

- Versioning activé sur tous les buckets
- Lifecycle policies configurées

### Procédure de restauration

\`\`\`bash
# Restaurer RDS depuis snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier restaurant-db-restored \
  --db-snapshot-identifier <snapshot-id>
\`\`\`

## Scaling

### Auto-scaling ECS/EKS

\`\`\`bash
# Configurer l'auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/restaurant-cluster/gateway-service \
  --min-capacity 2 \
  --max-capacity 10
\`\`\`

### Database Read Replicas

\`\`\`bash
# Créer une read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier restaurant-db-replica \
  --source-db-instance-identifier restaurant-db
\`\`\`

## Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Certificats SSL/TLS en place
- [ ] Base de données migrée
- [ ] Tests d'intégration passés
- [ ] Monitoring configuré
- [ ] Alertes configurées
- [ ] Backups testés
- [ ] Documentation mise à jour
- [ ] Plan de rollback préparé
\`\`\`
