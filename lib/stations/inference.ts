/**
 * Heuristique de dispatch vers une station
 * -----------------------------------------
 * Si le produit n'a pas de champ `station` en base (anciens items, demo data),
 * on infere la station a partir du nom du plat.
 */

import type { Station } from "./config"

const BAR_KEYWORDS = [
  "coca",
  "pepsi",
  "sprite",
  "fanta",
  "juice",
  "jus",
  "boisson",
  "drink",
  "limonade",
  "smoothie",
  "eau",
  "water",
  "cafe",
  "coffee",
  "the",
  "tea",
  "bier",
  "biere",
  "beer",
  "vin",
  "wine",
  "cocktail",
  "mocktail",
  "soda",
  "yaourt liquide",
  "ayran",
  "lassi",
  "milkshake",
  "dessert",
  "glace",
  "ice cream",
  "baklava",
  "tiramisu",
  "mousse",
]

const SHISHA_KEYWORDS = [
  "chicha",
  "shisha",
  "hookah",
  "narguile",
  "narguil",
  "double apple",
  "mint",
  "menthe",
  "raisin",
  "grape",
  "watermelon",
  "pasteque",
  "lemon mint",
  "blueberry",
  "pomme",
  "apple shisha",
]

/**
 * Infere la station selon le nom du plat.
 * Fallback: KITCHEN (la cuisine reste la station par defaut).
 */
export function inferStation(itemName: string): Station {
  const name = itemName.toLowerCase()
  if (SHISHA_KEYWORDS.some((kw) => name.includes(kw))) return "SHISHA"
  if (BAR_KEYWORDS.some((kw) => name.includes(kw))) return "BAR"
  return "KITCHEN"
}
