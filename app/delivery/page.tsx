"use client"

import { useEffect, useState } from "react"
import {
  ShoppingCart,
  Search,
  Star,
  Clock,
  Plus,
  Minus,
  Truck,
  X,
  Package,
  Store,
  ShoppingBag,
  Leaf,
  Filter,
  ArrowUpDown,
  Flame,
} from "lucide-react"
import Link from "next/link"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { SiteFooter } from "@/components/site/SiteFooter"
import { DeliveryPromoStrip } from "@/components/site/DeliveryPromoStrip"
import { SiteHeader } from "@/components/site/SiteHeader"
import { MobileBottomNav } from "@/components/site/MobileBottomNav"
import { SITE } from "@/lib/site-config"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { SmartRecommendations } from "@/components/site/SmartRecommendations"
import { MenuCardSkeletonGrid } from "@/components/site/MenuCardSkeleton"
import { MobileCartBar } from "@/components/site/MobileCartBar"
import { useRecommendations, trackItemView } from "@/lib/hooks/useRecommendations"
import { track } from "@/lib/hooks/useTrack"
import { toast } from "sonner"

// Mock Data
const categories = [
  { id: "all", name: "Tout", icon: "🍽️" },
  { id: "popular", name: "Populaire", icon: "🔥" },
  { id: "shawarma", name: "Shawarma", icon: "🌯" },
  { id: "manakish", name: "Manakish", icon: "🥙" },
  { id: "pizza", name: "Pizzas", icon: "🍕" },
  { id: "burger", name: "Burgers", icon: "🍔" },
  { id: "hot-dishes", name: "Plats chauds", icon: "🍲" },
  { id: "mezze", name: "Mezzés", icon: "🥗" },
  { id: "dessert", name: "Desserts", icon: "🍰" },
  { id: "drink", name: "Boissons", icon: "🥤" },
]

const menuItems = [
  // Shawarma
  {
    id: 1,
    name: "Shawarma Poulet",
    description: "Poulet mariné, sauce tarator, légumes frais, pain saj",
    price: 8.5,
    image: "/syrian-chicken-shawarma-wrap.jpg",
    category: "shawarma",
    rating: 4.9,
    reviews: 187,
    prepTime: "10-12 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "sésame"],
    isFeatured: true,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 2,
    name: "Shawarma Viande",
    description: "Bœuf mariné, tahini, oignons, tomates, pain saj",
    price: 9.5,
    image: "/syrian-beef-shawarma-platter.jpg",
    category: "shawarma",
    rating: 4.8,
    reviews: 156,
    prepTime: "10-12 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "sésame"],
    isFeatured: true,
    isAvailable: true,
    spiceLevel: "medium", // Added spiceLevel
  },
  {
    id: 3,
    name: "Shawarma Mixte",
    description: "Poulet et viande, sauce blanche et rouge, crudités",
    price: 10.0,
    image: "/mixed-shawarma-syrian-style.jpg",
    category: "shawarma",
    rating: 4.9,
    reviews: 203,
    prepTime: "12-15 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "sésame", "lactose"],
    isFeatured: true,
    isAvailable: true,
    spiceLevel: "medium", // Added spiceLevel
  },

  // Manakish
  {
    id: 4,
    name: "Manakish Zaatar",
    description: "Pain libanais, zaatar, huile d'olive, tomates",
    price: 5.5,
    image: "/manakish-zaatar-lebanese-flatbread.jpg",
    category: "manakish",
    rating: 4.7,
    reviews: 134,
    prepTime: "8-10 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten", "sésame"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 5,
    name: "Manakish Fromage",
    description: "Fromage akkawi, mozzarella, menthe fraîche",
    price: 6.5,
    image: "/manakish-cheese-akkawi-flatbread.jpg",
    category: "manakish",
    rating: 4.6,
    reviews: 98,
    prepTime: "8-10 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten", "lactose"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 6,
    name: "Manakish Mixte",
    description: "Zaatar et fromage, combinaison parfaite",
    price: 7.0,
    image: "/manakish-mixed-zaatar-cheese.jpg",
    category: "manakish",
    rating: 4.8,
    reviews: 112,
    prepTime: "8-10 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "lactose", "sésame"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },

  // Plats chauds
  {
    id: 7,
    name: "Kibbeh",
    description: "Boulettes de viande hachée, boulgour, pignons de pin",
    price: 12.0,
    image: "/syrian-kibbeh-meatballs-bulgur.jpg",
    category: "hot-dishes",
    rating: 4.9,
    reviews: 167,
    prepTime: "15-18 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "fruits à coque"],
    isFeatured: true,
    isAvailable: true,
    spiceLevel: "medium", // Added spiceLevel
  },
  {
    id: 8,
    name: "Kebab Halabi",
    description: "Brochettes d'agneau épicées, riz, grillades",
    price: 14.5,
    image: "/kebab-halabi-aleppo-style-lamb.jpg",
    category: "hot-dishes",
    rating: 4.9,
    reviews: 189,
    prepTime: "18-20 min",
    isPopular: true,
    isNew: false,
    allergens: [],
    isFeatured: true,
    isAvailable: true,
    spiceLevel: "hot", // Added spiceLevel
  },
  {
    id: 9,
    name: "Riz aux Vermicelles",
    description: "Riz basmati, vermicelles dorés, amandes grillées",
    price: 5.0,
    image: "/syrian-rice-vermicelli-nuts.jpg",
    category: "hot-dishes",
    rating: 4.5,
    reviews: 78,
    prepTime: "10-12 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten", "fruits à coque"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 10,
    name: "Falafel Assiette",
    description: "Boulettes de pois chiches, tahini, pain, salade",
    price: 9.0,
    image: "/falafel-plate-chickpea-tahini.jpg",
    category: "hot-dishes",
    rating: 4.7,
    reviews: 143,
    prepTime: "12-15 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten", "sésame"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 11,
    name: "Fattoush",
    description: "Salade libanaise, pain grillé, sumac, grenade",
    price: 7.5,
    image: "/fattoush-salad-lebanese-pomegranate.jpg",
    category: "hot-dishes",
    rating: 4.6,
    reviews: 91,
    prepTime: "8-10 min",
    isPopular: false,
    isNew: true,
    allergens: ["gluten"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },

  // Mezzés
  {
    id: 12,
    name: "Houmous",
    description: "Purée de pois chiches, tahini, citron, huile d'olive",
    price: 5.5,
    image: "/hummus-chickpea-tahini-dip.jpg",
    category: "mezze",
    rating: 4.8,
    reviews: 156,
    prepTime: "5 min",
    isPopular: true,
    isNew: false,
    allergens: ["sésame"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 13,
    name: "Moutabal",
    description: "Caviar d'aubergines grillées, tahini, ail",
    price: 6.0,
    image: "/moutabal-baba-ganoush-eggplant.jpg",
    category: "mezze",
    rating: 4.7,
    reviews: 124,
    prepTime: "5 min",
    isPopular: false,
    isNew: false,
    allergens: ["sésame"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 14,
    name: "Taboulé",
    description: "Persil, tomates, boulgour, citron, menthe",
    price: 6.5,
    image: "/tabbouleh-parsley-salad-bulgur.jpg",
    category: "mezze",
    rating: 4.6,
    reviews: 102,
    prepTime: "5 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 15,
    name: "Mouhammara",
    description: "Purée de poivrons rouges, noix, grenade",
    price: 6.5,
    image: "/muhammara-red-pepper-walnut-dip.jpg",
    category: "mezze",
    rating: 4.7,
    reviews: 87,
    prepTime: "5 min",
    isPopular: false,
    isNew: true,
    allergens: ["fruits à coque"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "medium", // Added spiceLevel
  },
  {
    id: 16,
    name: "Fatayer Épinards",
    description: "Chaussons aux épinards, oignons, sumac",
    price: 7.0,
    image: "/fatayer-spinach-triangular-pastries.jpg",
    category: "mezze",
    rating: 4.5,
    reviews: 73,
    prepTime: "10-12 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 17,
    name: "Sambousek Fromage",
    description: "Beignets au fromage feta et menthe",
    price: 6.5,
    image: "/sambousek-cheese-fried-pastries.jpg",
    category: "mezze",
    rating: 4.6,
    reviews: 95,
    prepTime: "10-12 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten", "lactose"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 18,
    name: "Sambousek Viande",
    description: "Beignets à la viande hachée épicée",
    price: 7.0,
    image: "/sambousek-meat-fried-pastries.jpg",
    category: "mezze",
    rating: 4.7,
    reviews: 108,
    prepTime: "10-12 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "medium", // Added spiceLevel
  },
  {
    id: 19,
    name: "Kebbé Nayé",
    description: "Tartare de viande crue, boulgour, épices",
    price: 13.0,
    image: "/kebbe-naye-raw-meat-bulgur-lebanese-tartare.jpg",
    category: "mezze",
    rating: 4.9,
    reviews: 67,
    prepTime: "8 min",
    isPopular: false,
    isNew: true,
    allergens: ["gluten"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "medium", // Added spiceLevel
  },
  {
    id: 20,
    name: "Labneh",
    description: "Yaourt égoutté, huile d'olive, zaatar",
    price: 5.0,
    image: "/labneh-yogurt-cheese-olive-oil-zaatar-middle-easte.jpg",
    category: "mezze",
    rating: 4.6,
    reviews: 89,
    prepTime: "3 min",
    isPopular: false,
    isNew: false,
    allergens: ["lactose", "sésame"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 21,
    name: "Feuilles de Vigne",
    description: "Feuilles farcies au riz, tomates, épices",
    price: 6.0,
    image: "/stuffed-grape-leaves-dolma-middle-eastern.jpg",
    category: "mezze",
    rating: 4.5,
    reviews: 71,
    prepTime: "5 min",
    isPopular: false,
    isNew: false,
    allergens: [],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },

  // Desserts
  {
    id: 22,
    name: "Baklava",
    description: "Pâtisserie aux noix, miel, pâte filo",
    price: 6.5,
    image: "/baklava-arabic-pastry-honey-nuts-layers.jpg",
    category: "dessert",
    rating: 4.9,
    reviews: 198,
    prepTime: "5 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "fruits à coque"],
    isFeatured: true,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 23,
    name: "Kunafa",
    description: "Cheveux d'ange, fromage, sirop de fleur d'oranger",
    price: 7.0,
    image: "/kunafa-knafeh-cheese-syrup-orange-blossom-arabic-d.jpg",
    category: "dessert",
    rating: 4.8,
    reviews: 176,
    prepTime: "5 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "lactose"],
    isFeatured: true,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 24,
    name: "Maamoul",
    description: "Biscuits aux dattes, pistaches ou noix",
    price: 5.5,
    image: "/maamoul-cookies-dates-pistachios-arabic-pastry-sem.jpg",
    category: "dessert",
    rating: 4.7,
    reviews: 143,
    prepTime: "3 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten", "fruits à coque"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 25,
    name: "Halawet El Jibn",
    description: "Roulé au fromage, crème, pistaches",
    price: 6.5,
    image: "/halawet-el-jibn-cheese-rolls-cream-pistachios-syri.jpg",
    category: "dessert",
    rating: 4.8,
    reviews: 132,
    prepTime: "5 min",
    isPopular: false,
    isNew: true,
    allergens: ["lactose", "fruits à coque"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 26,
    name: "Riz au Lait",
    description: "Crème de riz, eau de rose, pistaches",
    price: 4.5,
    image: "/rice-pudding-rose-water-pistachios-middle-eastern-.jpg",
    category: "dessert",
    rating: 4.6,
    reviews: 98,
    prepTime: "5 min",
    isPopular: false,
    isNew: false,
    allergens: ["lactose"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 27,
    name: "Mouhalabieh",
    description: "Flan à la fleur d'oranger, pistaches concassées",
    price: 5.0,
    image: "/mouhalabieh-muhallebi-milk-pudding-orange-blossom-.jpg",
    category: "dessert",
    rating: 4.7,
    reviews: 112,
    prepTime: "5 min",
    isPopular: false,
    isNew: false,
    allergens: ["lactose"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },

  // Boissons
  {
    id: 28,
    name: "Thé à la Menthe",
    description: "Thé noir, menthe fraîche",
    price: 2.5,
    image: "/mint-tea-fresh-leaves-arabic-middle-eastern-hot-be.jpg",
    category: "drink",
    rating: 4.5,
    reviews: 167,
    prepTime: "3 min",
    isPopular: false,
    isNew: false,
    allergens: [],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 29,
    name: "Café Turc",
    description: "Café moulu fin, cardamome",
    price: 3.0,
    image: "/turkish-coffee-cardamom-traditional-cup-foam.jpg",
    category: "drink",
    rating: 4.6,
    reviews: 143,
    prepTime: "5 min",
    isPopular: false,
    isNew: false,
    allergens: [],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 30,
    name: "Ayran",
    description: "Yaourt salé, menthe",
    price: 3.5,
    image: "/ayran-yogurt-drink-mint-salty-middle-eastern-bever.jpg",
    category: "drink",
    rating: 4.4,
    reviews: 89,
    prepTime: "2 min",
    isPopular: false,
    isNew: false,
    allergens: ["lactose"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 31,
    name: "Jus de Grenade",
    description: "Grenade fraîche pressée",
    price: 4.5,
    image: "/pomegranate-juice-fresh-red-fruit-drink-glass.jpg",
    category: "drink",
    rating: 4.7,
    reviews: 102,
    prepTime: "3 min",
    isPopular: false,
    isNew: true,
    allergens: [],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  // PIZZAS
  {
    id: 32,
    name: "Pizza Margherita",
    description: "Tomate, mozzarella, basilic frais",
    price: 12.99,
    image: "/pizza-margherita-basil-mozzarella-tomato.jpg",
    category: "pizza",
    rating: 4.8,
    reviews: 124,
    prepTime: "15-20 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "lactose"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 33,
    name: "Pizza 4 Fromages",
    description: "Mozzarella, gorgonzola, chèvre, parmesan",
    price: 14.99,
    image: "/four-cheese-pizza-quattro-formaggi-gorgonzola.jpg",
    category: "pizza",
    rating: 4.7,
    reviews: 98,
    prepTime: "15-20 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten", "lactose"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 34,
    name: "Pizza Regina",
    description: "Tomate, mozzarella, jambon, champignons",
    price: 13.99,
    image: "/pizza-regina-ham-mushrooms-cheese.jpg",
    category: "pizza",
    rating: 4.6,
    reviews: 87,
    prepTime: "15-20 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten", "lactose"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 35,
    name: "Pizza Végétarienne",
    description: "Tomate, mozzarella, légumes grillés, olives",
    price: 13.49,
    image: "/vegetarian-pizza-grilled-vegetables-olives.jpg",
    category: "pizza",
    rating: 4.7,
    reviews: 76,
    prepTime: "15-20 min",
    isPopular: false,
    isNew: true,
    allergens: ["gluten", "lactose"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 36,
    name: "Pizza Orientale",
    description: "Viande hachée, poivrons, oignons, épices syriennes",
    price: 15.99,
    image: "/middle-eastern-pizza-spiced-meat-peppers.jpg",
    category: "pizza",
    rating: 4.9,
    reviews: 145,
    prepTime: "18-22 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "lactose"],
    isFeatured: true,
    isAvailable: true,
    spiceLevel: "hot", // Added spiceLevel
  },

  // BURGERS
  {
    id: 37,
    name: "Burger Classic",
    description: "Bœuf angus, cheddar, sauce maison",
    price: 10.5,
    image: "/classic-beef-burger-cheddar-cheese-lettuce.jpg",
    category: "burger",
    rating: 4.7,
    reviews: 88,
    prepTime: "10-15 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "lactose", "eggs"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 38,
    name: "Burger Poulet Crispy",
    description: "Poulet pané croustillant, salade, sauce curry",
    price: 9.99,
    image: "/crispy-chicken-burger-breaded-curry-sauce.jpg",
    category: "burger",
    rating: 4.6,
    reviews: 102,
    prepTime: "12-16 min",
    isPopular: false,
    isNew: false,
    allergens: ["gluten", "eggs"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 39,
    name: "Burger Végétarien",
    description: "Steak de légumes, avocat, tomate",
    price: 9.5,
    image: "/vegetarian-veggie-burger-avocado-tomato.jpg",
    category: "burger",
    rating: 4.5,
    reviews: 67,
    prepTime: "10-14 min",
    isPopular: false,
    isNew: true,
    allergens: ["gluten"],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 40,
    name: "Burger Syrien",
    description: "Viande épicée, houmous, pickles, tahini",
    price: 11.99,
    image: "/middle-eastern-burger-hummus-tahini-spiced-meat.jpg",
    category: "burger",
    rating: 4.9,
    reviews: 156,
    prepTime: "12-16 min",
    isPopular: true,
    isNew: false,
    allergens: ["gluten", "sésame"],
    isFeatured: true,
    isAvailable: true,
    spiceLevel: "hot", // Added spiceLevel
  },

  {
    id: 41,
    name: "Coca-Cola",
    description: "Boisson gazeuse rafraîchissante 33cl",
    price: 2.5,
    image: "/coca-cola-glass-bottle-ice-cold.jpg",
    category: "drink",
    rating: 4.5,
    reviews: 234,
    prepTime: "1 min",
    isPopular: true,
    isNew: false,
    allergens: [],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 42,
    name: "Fanta Orange",
    description: "Boisson gazeuse à l'orange 33cl",
    price: 2.5,
    image: "/fanta-orange-soda-bottle-refreshing.jpg",
    category: "drink",
    rating: 4.4,
    reviews: 187,
    prepTime: "1 min",
    isPopular: false,
    isNew: false,
    allergens: [],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 43,
    name: "Eau Minérale",
    description: "Eau minérale naturelle 50cl",
    price: 1.5,
    image: "/mineral-water-bottle-natural-fresh.jpg",
    category: "drink",
    rating: 4.8,
    reviews: 312,
    prepTime: "1 min",
    isPopular: false,
    isNew: false,
    allergens: [],
    isFeatured: false,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
  {
    id: 44,
    name: "Jus d'Orange Frais",
    description: "Oranges pressées à la minute",
    price: 4.5,
    image: "/fresh-orange-juice-glass-pressed-citrus.jpg",
    category: "drink",
    rating: 4.9,
    reviews: 267,
    prepTime: "3-5 min",
    isPopular: true,
    isNew: false,
    allergens: [],
    isFeatured: true,
    isAvailable: true,
    spiceLevel: "mild", // Added spiceLevel
  },
]

type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  extras?: { name: string; price: number }[]
  size?: string
  serviceType?: string
  notes?: string
}

type CustomizationModal = {
  item: (typeof menuItems)[0] | null
  show: boolean
}

const availableExtras = [
  { id: "extra-cheese", name: "Fromage supplémentaire", price: 2.0 },
  { id: "extra-sauce", name: "Sauce supplémentaire", price: 1.5 },
  { id: "bacon", name: "Bacon", price: 2.5 },
  { id: "avocado", name: "Avocat", price: 3.0 },
]

const availableSizes = [
  { id: "small", name: "Petite", priceModifier: -2 },
  { id: "medium", name: "Moyenne", priceModifier: 0 },
  { id: "large", name: "Grande", priceModifier: 3 },
]

const serviceTypes = [
  { id: "delivery", name: "Livraison", icon: Truck, label: "Livraison", estimatedTime: "Livré à votre adresse" },
  { id: "dine-in", name: "Sur place", icon: Store, label: "Sur place", estimatedTime: "À consommer au restaurant" },
  {
    id: "takeaway",
    name: "À emporter",
    icon: ShoppingBag,
    label: "À emporter",
    estimatedTime: "À retirer au restaurant",
  },
]

const dietaryOptions = [
  { label: "Végétarien", value: "vegetarian" },
  { label: "Végan", value: "vegan" }, // Added Vegan option
  { label: "Sans gluten", value: "gluten-free" },
  { label: "Sans lactose", value: "lactose-free" },
  { label: "Halal", value: "halal" }, // Added Halal option
]

const spiceLevels = [
  { label: "Doux", value: "mild" },
  { label: "Moyennement épicé", value: "medium" },
  { label: "Très épicé", value: "hot" },
]

const sortOptions = [
  { label: "Prix croissant", value: "price-asc" },
  { label: "Prix décroissant", value: "price-desc" },
  { label: "Popularité", value: "popularity" },
  { label: "Note", value: "rating" },
  { label: "Nom A-Z", value: "name-asc" },
]

export default function DeliveryPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [favorites, setFavorites] = useState<number[]>([])
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 50])
  const [sortBy, setSortBy] = useState("popularity")
  const [spiceFilters, setSpiceFilters] = useState<string[]>([])

  const [customizationModal, setCustomizationModal] = useState<CustomizationModal>({ item: null, show: false })
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [selectedSize, setSelectedSize] = useState("medium")
  const [selectedServiceType, setSelectedServiceType] = useState("delivery")
  const [specialInstructions, setSpecialInstructions] = useState("")

  // Load any saved cart when the page mounts so totals stay consistent across navigation
  useEffect(() => {
    if (typeof window === "undefined") return
    const storedCart = localStorage.getItem("delivery-cart")
    if (!storedCart) return

    try {
      const parsed = JSON.parse(storedCart)
      if (Array.isArray(parsed.items)) {
        setCart(parsed.items)
      }
    } catch (error) {
      console.error("[delivery] Failed to parse stored cart", error)
    }
  }, [])

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "popular" ? item.isFeatured : item.category === selectedCategory)
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDietaryFilters = dietaryFilters.every((filter) => {
      if (filter === "vegan") {
        // Custom logic for vegan: check if it contains any non-vegan allergens
        const nonVeganAllergens = ["lactose", "eggs", "meat", "poultry", "fish", "seafood"] // Add more as needed
        return !item.allergens?.some((allergen) => nonVeganAllergens.includes(allergen))
      }
      // For other filters, check if the allergen is present
      return item.allergens?.includes(filter) || true // Allow if filter not applicable or allergen not present
    })
    const matchesPriceRange = item.price >= priceRange[0] && item.price <= priceRange[1]
    const matchesSpiceFilters = spiceFilters.length === 0 || spiceFilters.some((level) => item.spiceLevel === level)
    return matchesCategory && matchesSearch && matchesDietaryFilters && matchesPriceRange && matchesSpiceFilters
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price
      case "price-desc":
        return b.price - a.price
      case "popularity":
        // Prioritize featured items, then by number of reviews
        if (b.isFeatured !== a.isFeatured) return b.isFeatured ? 1 : -1
        return (b.reviews || 0) - (a.reviews || 0)
      case "rating":
        return (b.rating || 0) - (a.rating || 0)
      case "name-asc":
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const openCustomizationModal = (item: (typeof menuItems)[0]) => {
    trackItemView(item.id)
    track("view_item", { item: item.name, price: item.price })
    setCustomizationModal({ item, show: true })
    setSelectedExtras([])
    setSelectedSize("medium")
    setSelectedServiceType("delivery")
    setSpecialInstructions("")
  }

  const handleAddToCart = (item: (typeof menuItems)[0]) => {
    if (!item.isAvailable) return

    const cartItem: CartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    }

    setCart((prev) => [...prev, cartItem])
    setShowCart(true)
  }

  const handleConfirmCustomization = () => {
    if (!customizationModal.item) return

    const item = customizationModal.item
    const sizeModifier = availableSizes.find((s) => s.id === selectedSize)?.priceModifier || 0
    const extrasPrice = selectedExtras.reduce((sum, extraId) => {
      const extra = availableExtras.find((e) => e.id === extraId)
      return sum + (extra?.price || 0)
    }, 0)

    const finalPrice = item.price + sizeModifier + extrasPrice

    const cartItem: CartItem = {
      id: item.id,
      name: item.name,
      price: finalPrice,
      quantity: 1,
      image: item.image,
      extras: selectedExtras.map((id) => availableExtras.find((e) => e.id === id)!),
      size: availableSizes.find((s) => s.id === selectedSize)?.name,
      serviceType: serviceTypes.find((s) => s.id === selectedServiceType)?.label,
      notes: specialInstructions,
    }

    setCart((prev) => [...prev, cartItem])
    setCustomizationModal({ item: null, show: false })
    setShowCart(true)
    toast.success(`${item.name} ajoute au panier`)
    track("add_to_cart", { item: item.name, price: finalPrice })
  }

  const calculateCustomizationPrice = () => {
    if (!customizationModal.item) return 0

    const sizeModifier = availableSizes.find((s) => s.id === selectedSize)?.priceModifier || 0
    const extrasPrice = selectedExtras.reduce((sum, extraId) => {
      const extra = availableExtras.find((e) => e.id === extraId)
      return sum + (extra?.price || 0)
    }, 0)

    return customizationModal.item.price + sizeModifier + extrasPrice
  }

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id)
      if (existing && existing.quantity > 1) {
        return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleDietaryFilter = (filter: string) => {
    setDietaryFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]))
  }

  const toggleSpiceFilter = (level: string) => {
    setSpiceFilters((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const deliveryFee = cartTotal >= 25 ? 0 : 3.9
  const recommendations = useRecommendations(
    menuItems as any,
    cart.map((item) => item.id),
    4,
  )
  const subtotal = cartTotal
  const tva = subtotal * 0.19
  const totalWithTax = subtotal + tva + deliveryFee

  // Keep the checkout page in sync by persisting cart + summary data
  useEffect(() => {
    if (typeof window === "undefined") return

    if (cart.length === 0) {
      localStorage.removeItem("delivery-cart")
      return
    }

    const payload = {
      items: cart,
      summary: {
        subtotal,
        tva,
        deliveryFee,
        total: totalWithTax,
        itemsCount: cartItemsCount,
      },
    }

    try {
      localStorage.setItem("delivery-cart", JSON.stringify(payload))
    } catch (error) {
      console.error("[delivery] Failed to persist cart", error)
    }
  }, [cart, subtotal, tva, deliveryFee, totalWithTax, cartItemsCount])

  const searchField = (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-800/50" />
      <Input
        placeholder="Rechercher un plat…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-10 border-amber-900/15 bg-white/90 pl-9 shadow-sm backdrop-blur-sm"
      />
    </div>
  )

  return (
    <PageShell contentClassName="pb-20 lg:pb-0">
      <SiteHeader
        backHref="/"
        center={searchField}
        trailing={
          <div className="flex items-center gap-2">
            <Button size="pillSm" className="hidden gap-1.5 sm:flex" asChild>
              <Link href="/delivery/orders">
                <Package className="h-4 w-4" />
                Commandes
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCart(true)}
              className="relative gap-1.5 overflow-visible rounded-full border-amber-900/15 bg-white/90 shadow-sm"
              variant="outline"
            >
              <ShoppingCart className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Panier</span>
              {cartItemsCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 z-10 flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white"
                  aria-label={`${cartItemsCount} articles dans le panier`}
                >
                  {cartItemsCount > 99 ? "99+" : cartItemsCount}
                </span>
              ) : null}
            </Button>
          </div>
        }
      />
      <DeliveryPromoStrip />

      <PageHero
        imageSrc={SITE.images.delivery}
        imageAlt="Sélection de plats"
        kicker="À emporter & livraison"
        title="Nos créations"
        subtitle="Épices, cuissons lentes et produits choisis avec exigence — commandez en quelques gestes."
        height="sm"
      />

      {/* Categories */}
      <div id="menu" className="sticky top-14 z-40 border-b border-amber-200/40 bg-white/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/65">
        <div className="site-container py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Button
              type="button"
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={`shrink-0 gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory !== "all"
                  ? "border-amber-900/12 bg-white/90 text-amber-950 hover:border-amber-900/25"
                  : ""
              }`}
            >
              <Leaf className="h-4 w-4" />
              <span>Tous</span>
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "shrink-0 gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  selectedCategory !== cat.id &&
                    "border-amber-900/12 bg-white/90 text-amber-950 hover:bg-white",
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </Button>
            ))}
            <div className="ml-2 shrink-0 border-l border-amber-200/60 pl-3 sm:hidden">
              <Button size="pillSm" className="gap-1" asChild>
                <Link href="/delivery/orders">
                  <Package className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <main className="site-container flex-1 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-40 space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#d4a574] shadow-sm animate-fade-up">
                <h3 className="text-sm font-semibold text-[#2d2416] mb-4 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Trier par
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[#faf8f3] text-[#2d2416] border border-[#d4a574] hover:border-[#6b7c3a] focus:outline-none focus:ring-2 focus:ring-[#6b7c3a] transition-all"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dietary Filters */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#d4a574] shadow-sm animate-fade-up [animation-delay:80ms]">
                <h3 className="text-sm font-semibold text-[#2d2416] mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Préférences alimentaires
                </h3>
                <div className="space-y-2">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleDietaryFilter(option.value)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        dietaryFilters.includes(option.value)
                          ? "bg-[#6b7c3a] text-white shadow-md"
                          : "bg-[#faf8f3] text-[#2d2416] border border-[#d4a574] hover:border-[#6b7c3a]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#d4a574] shadow-sm animate-fade-up [animation-delay:160ms]">
                <h3 className="text-sm font-semibold text-[#2d2416] mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  Niveau d'épices
                </h3>
                <div className="space-y-2">
                  {spiceLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => toggleSpiceFilter(level.value)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        spiceFilters.includes(level.value)
                          ? "bg-[#d4522e] text-white shadow-md"
                          : "bg-[#faf8f3] text-[#2d2416] border border-[#d4a574] hover:border-[#d4522e]"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#d4a574] shadow-sm animate-fade-up [animation-delay:240ms]">
                <h3 className="text-sm font-semibold text-[#2d2416] mb-4">
                  Prix:{" "}
                  <span className="text-[#d4af37]">
                    {priceRange[0]}€ - {priceRange[1]}€
                  </span>
                </h3>
                {/* Price Range Slider */}
                {/* Placeholder for price range slider */}
              </div>
            </div>
          </aside>

          {/* Menu Items Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-[#6b5843]">
                <span className="font-semibold text-[#2d2416]">{sortedItems.length}</span> plat
                {sortedItems.length > 1 ? "s" : ""} disponible{sortedItems.length > 1 ? "s" : ""}
              </p>
            </div>
            <SmartRecommendations
              items={recommendations}
              onAdd={(item) => {
                handleAddToCart(menuItems.find((m) => m.id === item.id)!)
                toast.success(`${item.name} ajoute au panier`)
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#e8dcc8] hover:border-[#d4af37] animate-fade-up"
                  style={{ animationDelay: `${(sortedItems.indexOf(item) % 9) * 60}ms` }}
                >
                  <div className="relative h-56 bg-[#faf8f3] overflow-hidden">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {item.isNew && <Badge className="absolute top-3 left-3 bg-green-500">Nouveau</Badge>}
                    {item.isFeatured && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-[#d4af37] text-white rounded-full text-xs font-semibold shadow-lg">
                        Populaire
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-[#2d2416] mb-1">{item.name}</h3>
                      <p className="text-sm text-[#5d4e37] line-clamp-2">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                        <span className="text-sm font-medium">{item.rating}</span>
                        <span className="text-xs text-[#8b7355]">({item.reviews})</span>
                      </div>
                      <span className="text-[#8b7355]">•</span>
                      <div className="flex items-center gap-1 text-[#8b7355]">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{item.prepTime}</span>
                      </div>
                      {item.spiceLevel && (
                        <>
                          <span className="text-[#8b7355]">•</span>
                          <div className="flex items-center gap-1 text-xs font-medium">
                            {item.spiceLevel === "mild" && "🌶️ Doux"}
                            {item.spiceLevel === "medium" && "🌶️🌶️ Moyen"}
                            {item.spiceLevel === "hot" && "🌶️🌶️🌶️ Fort"}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-[#2d2416]">{item.price.toFixed(2)}€</span>
                      <Button
                        onClick={() => openCustomizationModal(item)}
                        disabled={!item.isAvailable}
                        className="w-full bg-gradient-to-r from-[#d4af37] to-[#c19a5b] hover:from-[#c19a5b] hover:to-[#b08949] text-white"
                      >
                        {item.isAvailable ? (
                          <span className="flex items-center justify-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Ajouter
                          </span>
                        ) : (
                          "Non disponible"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Customization Modal */}
      {customizationModal.show && customizationModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCustomizationModal({ item: null, show: false })}
          />
          <div className="relative w-full max-w-2xl bg-[#faf8f3] rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#faf8f3] border-b border-[#d4a574] p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-[#2d2416]">{customizationModal.item.name}</h2>
              <Button variant="ghost" size="icon" onClick={() => setCustomizationModal({ item: null, show: false })}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Sizes Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block text-[#2d2416]">Taille</Label>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="space-y-2">
                  {availableSizes.map((size) => (
                    <div
                      key={size.id}
                      className="flex items-center space-x-3 border border-[#d4a574] rounded-lg p-3 hover:border-[#d4af37] transition-colors bg-white"
                    >
                      <RadioGroupItem value={size.id} id={size.id} />
                      <Label htmlFor={size.id} className="flex-1 cursor-pointer text-[#2d2416]">
                        <span className="font-medium">{size.name}</span>
                        {size.priceModifier !== 0 && (
                          <span className="ml-2 text-sm text-[#5d4e37]">
                            ({size.priceModifier > 0 ? "+" : ""}
                            {size.priceModifier.toFixed(2)}€)
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Extras Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block text-[#2d2416]">Extras</Label>
                <div className="space-y-2">
                  {availableExtras.map((extra) => (
                    <div
                      key={extra.id}
                      className="flex items-center space-x-3 border border-[#d4a574] rounded-lg p-3 hover:border-[#d4af37] transition-colors bg-white"
                    >
                      <Checkbox
                        id={extra.id}
                        checked={selectedExtras.includes(extra.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedExtras([...selectedExtras, extra.id])
                          } else {
                            setSelectedExtras(selectedExtras.filter((id) => id !== extra.id))
                          }
                        }}
                      />
                      <Label htmlFor={extra.id} className="flex-1 cursor-pointer text-[#2d2416]">
                        <span className="font-medium">{extra.name}</span>
                        <span className="ml-2 text-sm text-[#5d4e37]">(+{extra.price.toFixed(2)}€)</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Type */}
              <div>
                <Label className="text-base font-semibold mb-3 block text-[#2d2416]">Type de service</Label>
                <RadioGroup value={selectedServiceType} onValueChange={setSelectedServiceType} className="space-y-2">
                  {serviceTypes.map((service) => {
                    const Icon = service.icon
                    return (
                      <div
                        key={service.id}
                        className="flex items-center space-x-3 border border-[#d4a574] rounded-lg p-3 hover:border-[#d4af37] transition-colors bg-white"
                      >
                        <RadioGroupItem value={service.id} id={service.id} />
                        <Icon className="w-5 h-5 text-[#5d4e37]" />
                        <Label htmlFor={service.id} className="flex-1 cursor-pointer text-[#2d2416]">
                          <span className="font-medium">{service.label}</span>
                          {service.estimatedTime && (
                            <span className="ml-2 text-sm text-[#5d4e37]">({service.estimatedTime})</span>
                          )}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              {/* Special Instructions */}
              <div>
                <Label htmlFor="instructions" className="text-base font-semibold mb-3 block text-[#2d2416]">
                  Instructions spéciales
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="Ex: Sans oignons, bien cuit..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="min-h-[100px] resize-none bg-white border-[#d4a574]"
                />
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleConfirmCustomization}
                className="w-full bg-gradient-to-r from-[#d4af37] to-[#c19a5b] hover:from-[#c19a5b] hover:to-[#b08949] text-white py-6 text-lg font-semibold"
              >
                <span className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Ajouter au panier - {calculateCustomizationPrice().toFixed(2)}€
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Votre panier</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <ShoppingCart className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Votre panier est vide</h3>
                <p className="text-slate-600 mb-6">Ajoutez des plats pour commencer votre commande</p>
                <Button onClick={() => setShowCart(false)}>Parcourir le menu</Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex gap-4 bg-slate-50 rounded-lg p-4">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 mb-1">{item.name}</h4>
                        {item.size && <p className="text-xs text-slate-600">Taille: {item.size}</p>}
                        {item.serviceType && <p className="text-xs text-slate-600">Service: {item.serviceType}</p>}
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-xs text-slate-600">Extras: {item.extras.map((e) => e.name).join(", ")}</p>
                        )}
                        {item.notes && <p className="text-xs text-slate-600 italic">Note: {item.notes}</p>}
                        <p className="text-sm font-medium text-slate-900 mt-2">{item.price.toFixed(2)}€</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const cartItem = cart.find((i, idx) => idx === index)
                              if (cartItem) {
                                setCart((prev) =>
                                  prev.map((i, idx) => (idx === index ? { ...i, quantity: i.quantity + 1 } : i)),
                                )
                              }
                            }}
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{(item.price * item.quantity).toFixed(2)}€</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Sous-total</span>
                      <span>{subtotal.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>TVA (19%)</span>
                      <span>{tva.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Frais de livraison</span>
                      <span className={deliveryFee === 0 ? "text-green-600 font-medium" : ""}>
                        {deliveryFee === 0 ? "Gratuit" : `${deliveryFee.toFixed(2)}€`}
                      </span>
                    </div>
                    {cartTotal < 25 && (
                      <p className="text-sm text-orange-600">
                        Ajoutez {(25 - cartTotal).toFixed(2)}€ pour la livraison gratuite
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between text-xl font-bold text-slate-900 pt-4 border-t border-slate-200">
                    <span>Total TTC</span>
                    <span>{totalWithTax.toFixed(2)}€</span>
                  </div>

                  <Button size="lg" className="w-full gap-2" asChild>
                    <Link href="/delivery/checkout">
                      <Truck className="w-5 h-5" />
                      Commander ({cartItemsCount})
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <MobileCartBar
        itemCount={cartItemsCount}
        total={totalWithTax}
        onOpen={() => setShowCart(true)}
      />
      <AIAgentBadge context="menu" position="bottom-left" />
      <SiteFooter />
      <MobileBottomNav />
    </PageShell>
  )
}
