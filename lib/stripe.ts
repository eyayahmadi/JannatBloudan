import Stripe from "stripe"

const secretKey = process.env.STRIPE_SECRET_KEY

// On ne jette plus d'exception pour éviter un 500 silencieux si la clé manque.
// Utilise la version par défaut Stripe pour éviter l'erreur "Invalid Stripe API version".
export const stripe = secretKey ? new Stripe(secretKey) : null
