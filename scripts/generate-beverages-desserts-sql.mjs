#!/usr/bin/env node
/**
 * Generates SQL migrations 48–53 for beverages, desserts, and shisha content.
 * Run: node scripts/generate-beverages-desserts-sql.mjs
 */
import { writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const REC = {
  "Gemischter Grillteller": "gemischter-grillteller",
  "Gemischter Grill (1kg)": "gemischter-grill-1kg",
  "Shawarma Teller": "shawarma-arabi-teller",
  "Shawarma Arabisch": "shawarma-arabi-teller",
  "Cheesecake Bloudan": "cheesecake-bloudan",
  "Obstsalat": "fruit-salad-bloudan",
  "Bloudan Fruchtesalat": "fruit-salad-bloudan",
  "Kebab Teller": "kebab-teller",
  "Kebab (1kg)": "kebab-1kg",
  Salat: "salat",
  Hummus: "hummus",
  "Chicken Nuggets": "chicken-nuggets-pommes",
  "Waffle Normal": "waffle-nature",
  "Waffle Nature": "waffle-nature",
  "Waffel Normal": "waffle-nature",
  "Waffel Bloudan": "waffle-nature",
  "Waffle Bloudan": "waffle-nature",
  "Waffle Oreo": "waffle-nature",
  "Waffle Schoko": "waffle-nature",
  "Waffle Ice Cream": "waffle-nature",
  "Waffle Ice Krem": "waffle-nature",
  "Oreo Waffle": "waffle-nature",
  "Crepe Lotus": "crepe-nature",
  "Crêpe Lotus": "crepe-nature",
  "Crepe Brownies": "crepe-nature",
  "Crêpe Dubai": "crepe-nature",
  "Crepe Dubai": "crepe-nature",
  "Crepe Bloudan": "crepe-nature",
  "Halloumi Teller": "halloumi-teller",
  "Falafel Halloumi Teller": "falafel-halloumi-teller",
  "Pancake Lotus": "pancake-nature",
  "Pan Cake Lotus": "pancake-nature",
  "Chicken Fries": "chicken-fries",
  "Crepe Dubai": "crepe-nature",
  "Cheesecake Dubai": "cheesecake-dubai",
  "Dubai Cheesecake": "cheesecake-dubai",
  "Früchtesalat Dubai": "fruit-salad-dubai",
  "Fruit Salad Dubai": "fruit-salad-dubai",
  "Früchtesalat Lotus": "fruit-salad-lotus",
  "Früchtesalat Bloudan": "fruit-salad-bloudan",
  "Fruit Salad Bloudan": "fruit-salad-bloudan",
  "Oreo Cheesecake": "cheesecake-oreo",
  "Cheesecake Oreo": "cheesecake-oreo",
  "Lotus Cheesecake": "cheesecake-lotus",
  "Arabischer Eisbecher": "coupe-arabe",
  "Erdbeer Eis": "eis-fraise",
  "Vanille Eis": "eis-vanille",
  "Vanille Eisbecher": "eis-vanille",
  "Burger Classic": "klassik-burger",
  "Klassik Burger": "klassik-burger",
  "Shawarma Sandwich": "shawarma-sandwich",
  "Chicken Sandwich": "crispy-chicken-sandwich",
  "Crispy Chicken Sandwich": "crispy-chicken-sandwich",
  "Pommes Teller": "pommes-teller",
  "Pizza Mexikano": "pizza-mexikano",
  "Pizza Margherita": "pizza-margherita",
  "Fajita Teller": "fajita-teller",
  "Crispy Chicken Burger": "crispy-chicken-burger",
  "Bloudan Burger": "bloudan-burger",
  "Gemischter Grillteller": "gemischter-grillteller",
  "Shisha Bloudan": "shisha-bloudan",
  "Bloudan Shisha": "shisha-bloudan",
  "Love 66": "shisha-love-66",
  "Love 66 Shisha": "shisha-love-66",
  "Früchte Shisha": "shisha-fruits",
  "Shisha Früchte": "shisha-fruits",
  "Cinderella Shisha": "shisha-cinderella",
  "Raffaello Shisha": "shisha-raffaello",
  "Polo Shisha": "shisha-polo",
  "Früchte Shisha": "shisha-fruits",
  "Brownie Cake": "brownie-cake",
  "Cola": "coca-cola",
  "Coca-Cola": "coca-cola",
  Sprite: "sprite",
  "Crepe Nature": "crepe-nature",
  "Crêpe Nature": "crepe-nature",
  "Latte Macchiato": "latte-macchiato",
  "Oreo Milkshake": "oreo-milkshake",
  "Oreo Milchshake": "oreo-milkshake",
  "Bloudan Smoothie": "bloudan-smoothie",
  "Bloudan Milkshake": "bloudan-milkshake",
  "Bloudan Milchshake": "bloudan-milkshake",
  "Schoko Milkshake": "schokoladen-milkshake",
  "Schoko Milchshake": "schokoladen-milkshake",
  "Erdbeer Smoothie": "erdbeer-smoothie",
  "Erdbeer Milchshake": "erdbeer-milkshake",
  "Mango Smoothie": "mango-smoothie",
  "Hot Chocolate": "hot-chocolate",
  "Heiße Schokolade": "hot-chocolate",
  "Heiss Schokolade": "hot-chocolate",
  "Schwarzer Tee": "schwarzer-tee",
  "Arabische Kaffee": "arabic-coffee",
  "Arabic Coffee": "arabic-coffee",
  Nüsse: "noix",
  Nuts: "noix",
  Baklava: "brownie-cake",
  Frappuccino: "frappuccino",
  "Iced Latte": "iced-latte-macchiato",
  "Iced Latte Vanille": "iced-latte-vanilla",
  "Iced Mocha": "iced-mocha",
  "Latte Schoko": "chocolate-latte",
  "Latte Vanille": "vanilla-latte",
  "Cheesecake Lotus": "cheesecake-lotus",
  "Pistachio Milkshake": "bloudan-milkshake",
  "Pistazien Milchshake": "bloudan-milkshake",
  "Mineralwasser": "mineralwasser",
  "Crepe Brownies": "crepe-nature",
  "Ice Tea Wassermelone": "eistee-wassermelone",
}

function flags(tags) {
  const t = tags || []
  return {
    is_popular: t.includes("popular") || t.includes("best_seller"),
    is_vegetarian: t.includes("vegetarian"),
    is_vegan: t.includes("vegan"),
    is_halal: !t.includes("non_halal"),
    is_chef_choice: t.includes("chef_recommendation"),
    spice_level: t.includes("spicy") ? "'épicé'" : "NULL",
  }
}

function esc(s) {
  return s.replace(/'/g, "''")
}

function updateBlock(p) {
  const f = flags(p.tags)
  return `UPDATE products SET
  description = '${esc(p.descDe)}',
  description_ar = '${esc(p.descAr)}',
  tags = '${JSON.stringify(p.tags)}'::jsonb,
  is_popular = ${f.is_popular}, is_vegetarian = ${f.is_vegetarian}, is_vegan = ${f.is_vegan}, is_halal = ${f.is_halal}, is_chef_choice = ${f.is_chef_choice},
  spice_level = ${f.spice_level}
WHERE slug = '${p.slug}';`
}

function recBlock(products) {
  const lines = []
  for (const p of products) {
    if (!p.recs?.length) continue
    const slugs = [...new Set(p.recs.map((r) => REC[r] || r).filter(Boolean))]
    lines.push(`  rec_slugs := ARRAY[${slugs.map((s) => `'${s}'`).join(", ")}];
  SELECT id INTO pid FROM products WHERE slug = '${p.slug}';
  IF pid IS NOT NULL THEN DELETE FROM product_recommendations WHERE product_id = pid; ord := 0;
    FOREACH rec_slug IN ARRAY rec_slugs LOOP SELECT id INTO rid FROM products WHERE slug = rec_slug; IF rid IS NOT NULL THEN INSERT INTO product_recommendations (product_id, recommended_product_id, display_order) VALUES (pid, rid, ord); ord := ord + 1; END IF; END LOOP;
  END IF;`)
  }
  return `DO $$
DECLARE pid UUID; rid UUID; rec_slugs TEXT[]; rec_slug TEXT; ord INT;
BEGIN
${lines.join("\n\n")}
END $$;`
}

function writeMigration(num, name, header, products) {
  const sql = `-- ${header}
BEGIN;

${products.map(updateBlock).join("\n\n")}

${recBlock(products)}

COMMIT;
`
  writeFileSync(join(__dirname, `${num}-${name}.sql`), sql, "utf8")
  console.log(`  ✔  ${num}-${name}.sql (${products.length} products)`)
}

// ── 48 Cold drinks / soft drinks / ice tea ──
writeMigration("48", "cold-drinks-content", "48 — Cold Drinks, Soft Drinks, Ice Tea", [
  { slug: "stillwasser", tags: ["halal", "vegan", "vegetarian"], descDe: "Natürliches stilles Mineralwasser, perfekt gekühlt und die ideale Begleitung zu jeder Mahlzeit.", descAr: "مياه معدنية طبيعية باردة، مثالية مع جميع الوجبات.", recs: ["Gemischter Grillteller", "Shawarma Teller", "Cheesecake Bloudan"] },
  { slug: "mineralwasser", tags: ["halal", "vegan", "vegetarian"], descDe: "Erfrischendes Mineralwasser mit Kohlensäure.", descAr: "مياه غازية باردة ومنعشة.", recs: ["Kebab Teller", "Salat", "Hummus"] },
  { slug: "ananassaft", tags: ["halal", "vegan", "vegetarian"], descDe: "Fruchtiger Ananassaft mit natürlicher Süße und tropischem Aroma.", descAr: "عصير أناناس طبيعي بطعم استوائي منعش.", recs: ["Chicken Nuggets", "Waffle Normal", "Crepe Lotus"] },
  { slug: "apfelsaft", tags: ["halal", "vegan", "vegetarian"], descDe: "Frischer Apfelsaft mit ausgewogenem Geschmack.", descAr: "عصير تفاح طبيعي ومنعش.", recs: ["Halloumi Teller", "Cheesecake Bloudan", "Brownie Cake"] },
  { slug: "orangensaft", tags: ["halal", "vegan", "vegetarian"], descDe: "Frischer Orangensaft voller Vitamine.", descAr: "عصير برتقال طبيعي غني بالنكهة.", recs: ["Falafel Halloumi Teller", "Pancake Lotus", "Waffle Bloudan"] },
  { slug: "mangosaft", tags: ["halal", "vegan", "vegetarian", "popular"], descDe: "Exotischer Mangosaft mit intensivem Fruchtgeschmack.", descAr: "عصير مانجو استوائي غني بالطعم.", recs: ["Chicken Fries", "Crepe Dubai", "Cheesecake Dubai"] },
  { slug: "erdbeersaft", tags: ["halal", "vegan", "vegetarian"], descDe: "Fruchtiger Erdbeersaft, frisch und erfrischend.", descAr: "عصير فراولة طبيعي ومنعش.", recs: ["Waffle Oreo", "Brownie Cake", "Erdbeer Eis"] },
  { slug: "maracujasaft", tags: ["halal", "vegan", "vegetarian"], descDe: "Exotischer Maracujasaft mit angenehm fruchtiger Note.", descAr: "عصير ماراكويا استوائي ومنعش.", recs: ["Früchtesalat Dubai", "Pancake Lotus", "Oreo Cheesecake"] },
  { slug: "kiba", tags: ["halal", "vegetarian"], descDe: "Fruchtige Mischung aus Banane und Kirsche.", descAr: "مزيج منعش من الموز والكرز.", recs: ["Crepe Brownies", "Waffle Bloudan", "Arabischer Eisbecher"] },
  { slug: "coca-cola", tags: ["halal", "popular"], descDe: "Eiskalte Coca-Cola – der Klassiker zu jeder Mahlzeit.", descAr: "كوكاكولا باردة ومنعشة.", recs: ["Burger Classic", "Shawarma Sandwich", "Pommes Teller"] },
  { slug: "coca-cola-zero", tags: ["halal"], descDe: "Kalorienfreie Coca-Cola Zero mit vollem Geschmack.", descAr: "كوكاكولا زيرو بدون سكر.", recs: ["Chicken Fries", "Crispy Chicken Burger", "Gemischter Grillteller"] },
  { slug: "fanta", tags: ["halal", "popular"], descDe: "Erfrischende Orangenlimonade.", descAr: "فانتا بنكهة البرتقال.", recs: ["Pizza Mexikano", "Chicken Nuggets", "Crispy Chicken Sandwich"] },
  { slug: "sprite", tags: ["halal", "popular"], descDe: "Spritzige Zitronenlimonade, eisgekühlt serviert.", descAr: "سبرايت منعش بنكهة الليمون.", recs: ["Fajita Teller", "Shawarma Arabisch", "Chicken Fries"] },
  { slug: "red-bull", tags: ["halal"], descDe: "Original Red Bull Energy Drink.", descAr: "مشروب ريد بول الأصلي للطاقة.", recs: ["Shisha Bloudan", "Love 66", "Brownie Cake"] },
  { slug: "red-bull-sugar-free", tags: ["halal"], descDe: "Zuckerfreier Energy Drink.", descAr: "ريد بول بدون سكر.", recs: ["Früchte Shisha", "Waffle Oreo", "Lotus Cheesecake"] },
  { slug: "red-bull-white", tags: ["halal"], descDe: "Red Bull White Edition mit fruchtigem Geschmack.", descAr: "ريد بول وايت بنكهة مميزة.", recs: ["Cinderella Shisha", "Oreo Cheesecake", "Waffle Ice Cream"] },
  { slug: "eistee-pfirsich", tags: ["halal", "popular"], descDe: "Erfrischender Pfirsich-Eistee.", descAr: "شاي مثلج بنكهة الخوخ.", recs: ["Pizza Margherita", "Chicken Sandwich", "Crepe Lotus"] },
  { slug: "eistee-zitrone", tags: ["halal"], descDe: "Klassischer Zitronen-Eistee.", descAr: "شاي مثلج بنكهة الليمون.", recs: ["Gemischter Grillteller", "Shawarma Teller", "Bloudan Fruchtesalat"] },
  { slug: "eistee-wassermelone", tags: ["halal"], descDe: "Fruchtiger Eistee mit Wassermelonengeschmack.", descAr: "شاي مثلج بنكهة البطيخ.", recs: ["Bloudan Burger", "Crispy Chicken Burger", "Dubai Cheesecake"] },
])

// ── 49 Cocktails / smoothies / milkshakes / imperator ──
writeMigration("49", "cocktails-content", "49 — Cocktails, Smoothies, Milkshakes, Imperator", [
  { slug: "mojito", tags: ["halal", "popular", "refreshing"], descDe: "Erfrischender alkoholfreier Mojito mit frischer Minze, Limette und Sprudel.", descAr: "موهيتو منعش بدون كحول مع النعناع الطازج والليمون.", recs: ["Shisha Love 66", "Waffle Bloudan", "Oreo Cheesecake"] },
  { slug: "erdbeer-mojito", tags: ["halal", "popular", "refreshing"], descDe: "Alkoholfreier Mojito mit frischen Erdbeeren und Minze.", descAr: "موهيتو فراولة منعش مع النعناع الطازج.", recs: ["Crepe Lotus", "Oreo Waffle", "Bloudan Shisha"] },
  { slug: "maracuja-splash", tags: ["halal", "tropical"], descDe: "Fruchtiger Maracuja-Cocktail mit tropischem Geschmack.", descAr: "كوكتيل ماراكويا استوائي منعش.", recs: ["Dubai Cheesecake", "Fruit Salad Dubai", "Cinderella Shisha"] },
  { slug: "sweet-ananas", tags: ["halal", "tropical"], descDe: "Erfrischender Cocktail mit süßer Ananas.", descAr: "كوكتيل أناناس منعش بطعم استوائي.", recs: ["Waffle Ice Cream", "Brownie Cake", "Früchte Shisha"] },
  { slug: "ipanema", tags: ["halal", "refreshing"], descDe: "Klassischer alkoholfreier Cocktail mit Limette und Maracuja.", descAr: "كوكتيل إيبانيما المنعش بالليمون والماراكويا.", recs: ["Crepe Dubai", "Oreo Cheesecake", "Raffaello Shisha"] },
  { slug: "jamaica", tags: ["halal", "tropical"], descDe: "Exotischer Fruchtcocktail mit tropischem Aroma.", descAr: "كوكتيل فواكه استوائي غني بالنكهات.", recs: ["Fruit Salad Bloudan", "Cheesecake Bloudan", "Polo Shisha"] },
  { slug: "bloudan-smoothie", tags: ["halal", "popular", "vegetarian"], descDe: "Hausgemachter Smoothie aus frischen Früchten.", descAr: "سموذي بلودان المحضر من تشكيلة فواكه طازجة.", recs: ["Waffle Bloudan", "Crepe Bloudan", "Cheesecake Bloudan"] },
  { slug: "mango-smoothie", tags: ["halal", "vegetarian"], descDe: "Cremiger Mango-Smoothie aus sonnengereiften Mangos.", descAr: "سموذي مانجو كريمي ومنعش.", recs: ["Pancake Lotus", "Oreo Cheesecake", "Brownie Cake"] },
  { slug: "erdbeer-smoothie", tags: ["halal", "vegetarian"], descDe: "Frischer Erdbeer-Smoothie mit natürlicher Süße.", descAr: "سموذي فراولة طبيعي ومنعش.", recs: ["Crepe Lotus", "Waffle Oreo", "Vanille Eis"] },
  { slug: "ananas-smoothie", tags: ["halal", "vegetarian"], descDe: "Fruchtiger Ananas-Smoothie mit tropischem Geschmack.", descAr: "سموذي أناناس استوائي منعش.", recs: ["Fruit Salad Dubai", "Brownie Cake", "Love 66 Shisha"] },
  { slug: "polo-smoothie", tags: ["halal", "refreshing"], descDe: "Erfrischender Limetten-Minze-Smoothie.", descAr: "سموذي ليمون ونعناع منعش.", recs: ["Shawarma Teller", "Gemischter Grillteller", "Früchte Shisha"] },
  { slug: "bloudan-milkshake", tags: ["halal", "contains_milk", "chef_recommendation"], descDe: "Hausgemachter Premium-Milchshake mit Spezialrezept.", descAr: "ميلك شيك بلودان الكريمي بوصفة خاصة.", recs: ["Waffle Bloudan", "Cheesecake Bloudan", "Brownie Cake"] },
  { slug: "erdbeer-milkshake", tags: ["halal", "contains_milk"], descDe: "Cremiger Milchshake mit frischen Erdbeeren.", descAr: "ميلك شيك بالفراولة الطازجة.", recs: ["Crepe Lotus", "Oreo Cheesecake", "Waffle Oreo"] },
  { slug: "schokoladen-milkshake", tags: ["halal", "contains_milk", "popular"], descDe: "Schokoladiger Milchshake mit cremiger Konsistenz.", descAr: "ميلك شيك شوكولا غني وكريمي.", recs: ["Brownie Cake", "Oreo Waffle", "Oreo Cheesecake"] },
  { slug: "oreo-milkshake", tags: ["halal", "contains_milk", "popular"], descDe: "Milchshake mit Oreo-Keksen und cremigem Eis.", descAr: "ميلك شيك أوريو مع بسكويت أوريو وآيس كريم.", recs: ["Oreo Cheesecake", "Oreo Waffle", "Crepe Brownies"] },
  { slug: "imperator-avoca-free", tags: ["halal", "premium", "chef_recommendation"], descDe: "XXL-Fruchtmix mit Avocado, Erdbeeren, Honig und arabischer Rahmcreme.", descAr: "كوكتيل فاخر بالأفوكادو والفراولة والعسل والقشطة العربية.", recs: ["Bloudan Shisha", "Waffle Bloudan", "Cheesecake Bloudan"] },
  { slug: "imperator-pinastro-flix", tags: ["halal", "premium"], descDe: "XXL-Fruchtcocktail mit Ananas, Kiwi und Cornflakes.", descAr: "كوكتيل فواكه فاخر بالأناناس والكيوي والكورن فليكس.", recs: ["Fruit Salad Dubai", "Brownie Cake", "Love 66 Shisha"] },
  { slug: "imperator-x4", tags: ["halal", "premium"], descDe: "Großer Fruchtmix mit Ananas, Erdbeeren, Kiwi und Zitrone.", descAr: "كوكتيل فواكه كبير بالأناناس والفراولة والكيوي والليمون.", recs: ["Dubai Cheesecake", "Crepe Dubai", "Raffaello Shisha"] },
  { slug: "imperator-thundermix", tags: ["halal", "premium"], descDe: "XXL-Fruchtmix mit Wassermelone, Erdbeeren, Zitrone und Ananas.", descAr: "كوكتيل فواكه فاخر بالبطيخ والفراولة والأناناس.", recs: ["Fruit Salad Bloudan", "Waffle Ice Cream", "Früchte Shisha"] },
])

// Fix REC for Shisha Love 66
REC["Shisha Love 66"] = "shisha-love-66"

// ── 50 Coffee / banana / iced ──
writeMigration("50", "coffee-content", "50 — Banana Milk, Iced Coffee, Hot Drinks", [
  { slug: "banane-milch-avocado", tags: ["halal", "contains_milk", "popular"], descDe: "Cremiger Cocktail aus Banane, frischer Milch und Avocado.", descAr: "كوكتيل كريمي بالموز والحليب والأفوكادو.", recs: ["Waffle Bloudan", "Cheesecake Bloudan", "Bloudan Shisha"] },
  { slug: "banane-milch-erdbeere", tags: ["halal", "contains_milk"], descDe: "Fruchtiger Milchcocktail mit Banane und Erdbeeren.", descAr: "كوكتيل حليب بالموز والفراولة الطازجة.", recs: ["Crepe Lotus", "Oreo Cheesecake", "Love 66 Shisha"] },
  { slug: "banane-milch-schokolade", tags: ["halal", "contains_milk", "popular"], descDe: "Cremiger Bananen-Milchcocktail mit Schokolade.", descAr: "كوكتيل حليب بالموز والشوكولا.", recs: ["Brownie Cake", "Oreo Waffle", "Oreo Cheesecake"] },
  { slug: "iced-latte-macchiato", tags: ["halal", "contains_milk"], descDe: "Eiskalter Latte Macchiato mit cremigem Milchschaum.", descAr: "لاتيه ماكياتو بارد مع رغوة حليب كريمية.", recs: ["Crepe Brownies", "Cheesecake Oreo", "Waffle Ice Cream"] },
  { slug: "iced-latte-chocolate", tags: ["halal", "contains_milk"], descDe: "Kalter Latte mit feiner Schokolade.", descAr: "لاتيه بارد بنكهة الشوكولا.", recs: ["Brownie Cake", "Oreo Cheesecake", "Waffle Schoko"] },
  { slug: "iced-latte-vanilla", tags: ["halal", "contains_milk"], descDe: "Erfrischender Latte mit Vanillearoma.", descAr: "لاتيه بارد بنكهة الفانيليا.", recs: ["Cheesecake Lotus", "Crepe Lotus", "Waffle Normal"] },
  { slug: "iced-latte-caramel", tags: ["halal", "contains_milk"], descDe: "Kalter Latte mit süßem Karamell.", descAr: "لاتيه بارد بنكهة الكراميل.", recs: ["Brownie Cake", "Cheesecake Dubai", "Oreo Waffle"] },
  { slug: "frappuccino", tags: ["halal", "contains_milk", "popular"], descDe: "Cremiger Frappuccino mit Eis und Kaffee.", descAr: "فرابتشينو كريمي بالقهوة والثلج.", recs: ["Crepe Bloudan", "Cheesecake Bloudan", "Waffle Bloudan"] },
  { slug: "iced-mocha", tags: ["halal", "contains_milk"], descDe: "Eiskalter Kaffee mit Schokolade.", descAr: "آيس موكا بالقهوة والشوكولا.", recs: ["Brownie Cake", "Oreo Cheesecake", "Waffle Oreo"] },
  { slug: "arabic-coffee", tags: ["halal"], descDe: "Traditioneller arabischer Kaffee mit intensivem Aroma.", descAr: "قهوة عربية أصيلة تقدم ساخنة.", recs: ["Schwarzer Tee", "Nüsse", "Shisha Bloudan"] },
  { slug: "espresso", tags: ["halal"], descDe: "Kräftiger italienischer Espresso.", descAr: "إسبريسو مركز وغني بالنكهة.", recs: ["Cheesecake Bloudan", "Brownie Cake", "Oreo Cheesecake"] },
  { slug: "espresso-macchiato", tags: ["halal", "contains_milk"], descDe: "Espresso mit feinem Milchschaum.", descAr: "إسبريسو مع رغوة حليب خفيفة.", recs: ["Brownie Cake", "Waffle Schoko", "Cheesecake Oreo"] },
  { slug: "cappuccino", tags: ["halal", "contains_milk", "popular"], descDe: "Cremiger Cappuccino mit Milchschaum.", descAr: "كابتشينو كريمي مع رغوة الحليب.", recs: ["Crepe Lotus", "Brownie Cake", "Cheesecake Bloudan"] },
  { slug: "latte-macchiato", tags: ["halal", "contains_milk"], descDe: "Klassischer Latte Macchiato mit cremigem Milchschaum.", descAr: "لاتيه ماكياتو كلاسيكي برغوة حليب كريمية.", recs: ["Waffle Bloudan", "Oreo Cheesecake", "Crepe Dubai"] },
  { slug: "chocolate-latte", tags: ["halal", "contains_milk"], descDe: "Heißer Latte mit feiner Schokolade.", descAr: "لاتيه ساخن بالشوكولا.", recs: ["Brownie Cake", "Oreo Waffle", "Cheesecake Oreo"] },
  { slug: "vanilla-latte", tags: ["halal", "contains_milk"], descDe: "Latte mit feinem Vanillearoma.", descAr: "لاتيه ساخن بالفانيليا.", recs: ["Crepe Lotus", "Waffle Normal", "Cheesecake Lotus"] },
  { slug: "caramel-latte", tags: ["halal", "contains_milk"], descDe: "Latte mit cremigem Karamell.", descAr: "لاتيه ساخن بنكهة الكراميل.", recs: ["Brownie Cake", "Oreo Cheesecake", "Waffle Bloudan"] },
  { slug: "al-pacchino", tags: ["halal", "contains_milk", "chef_recommendation"], descDe: "Hausgemachte Kaffeespezialität mit cremigem Geschmack.", descAr: "مشروب قهوة خاص بالمطعم بقوام كريمي.", recs: ["Cheesecake Bloudan", "Brownie Cake", "Crepe Bloudan"] },
  { slug: "americano", tags: ["halal"], descDe: "Klassischer Americano aus frisch gebrühtem Espresso.", descAr: "قهوة أمريكانو كلاسيكية.", recs: ["Cheesecake Oreo", "Brownie Cake", "Waffle Normal"] },
  { slug: "flat-white", tags: ["halal", "contains_milk"], descDe: "Kräftiger Espresso mit samtiger Milch.", descAr: "فلات وايت بقهوة قوية وحليب كريمي.", recs: ["Crepe Lotus", "Cheesecake Bloudan", "Brownie Cake"] },
  { slug: "mocha", tags: ["halal", "contains_milk"], descDe: "Warmer Kaffee mit Schokolade.", descAr: "قهوة موكا بالشوكولا.", recs: ["Brownie Cake", "Oreo Cheesecake", "Waffle Schoko"] },
  { slug: "hot-chocolate", tags: ["halal", "contains_milk", "kids_friendly"], descDe: "Heiße cremige Schokolade.", descAr: "شوكولا ساخنة كريمية.", recs: ["Waffle Oreo", "Brownie Cake", "Cheesecake Lotus"] },
  { slug: "sahlab", tags: ["halal", "contains_milk", "popular"], descDe: "Traditioneller orientalischer Sahlab mit Zimt.", descAr: "سحلب شرقي ساخن مع القرفة.", recs: ["Schwarzer Tee", "Brownie Cake", "Bloudan Shisha"] },
])

// ── 51 Tea + waffle-nature + crepe-nature (latest user spec) ──
writeMigration("51", "tea-waffles-crepes-content", "51 — Tea, Waffles, Crêpes", [
  { slug: "schwarzer-tee", tags: ["halal", "vegan", "popular"], descDe: "Traditioneller schwarzer Tee nach orientalischer Art, serviert mit frischer Minze oder mit Ingwer und Honig.", descAr: "شاي أسود بالطريقة الشرقية التقليدية يقدم مع النعناع الطازج أو الزنجبيل والعسل.", recs: ["Waffel Bloudan", "Crepe Lotus", "Bloudan Shisha"] },
  { slug: "gruen-tee", tags: ["halal", "vegan"], descDe: "Aromatischer grüner Tee mit mildem Geschmack, frisch zubereitet.", descAr: "شاي أخضر طبيعي بطعم منعش وخفيف.", recs: ["Waffel Normal", "Früchtesalat Lotus", "Love 66 Shisha"] },
  { slug: "ingwer-zitrone", tags: ["halal", "vegan"], descDe: "Wärmender Ingwertee mit frischer Zitrone.", descAr: "مشروب زنجبيل طازج مع الليمون.", recs: ["Crepe Brownies", "Cheesecake Bloudan", "Bloudan Shisha"] },
  { slug: "kamille-tee", tags: ["halal", "vegan"], descDe: "Beruhigender Kamillentee mit feinem Aroma.", descAr: "شاي بابونج طبيعي ومهدئ.", recs: ["Waffel Schoko", "Oreo Cheesecake", "Früchte Shisha"] },
  { slug: "mate", tags: ["halal", "vegan", "popular"], descDe: "Traditionelle Mate nach orientalischer Art serviert.", descAr: "متة أصلية تقدم بالطريقة التقليدية.", recs: ["Bloudan Shisha", "Nüsse", "Arabische Kaffee"] },
  { slug: "cumin-lemon-tea", tags: ["halal", "vegan"], descDe: "Warmes Getränk aus Kreuzkümmel und frischer Zitrone.", descAr: "مشروب ساخن من الكمون والليمون.", recs: ["Arabische Kaffee", "Love 66 Shisha", "Nüsse"] },
  { slug: "waffle-nature", tags: ["halal", "contains_milk", "contains_gluten"], descDe: "Frisch gebackene goldene Waffel mit feinem Zucker.", descAr: "وافل طازج ومقرمش يقدم ساخناً.", recs: ["Schwarzer Tee", "Erdbeer Smoothie", "Heiße Schokolade"] },
  { slug: "crepe-nature", tags: ["halal", "contains_milk", "contains_gluten", "popular"], descDe: "Frisch zubereiteter Crêpe nach Wunsch — wählen Sie aus unserer Auswahl an Extras und Füllungen.", descAr: "كريب طازج حسب الطلب — اختر من تشكيلة الإضافات والحشوات.", recs: ["Latte Vanille", "Mango Smoothie", "Lotus Cheesecake"] },
])

REC["Waffel Bloudan"] = "waffle-nature"
REC["Waffel Normal"] = "waffle-nature"
REC["Waffel Schoko"] = "waffle-nature"
REC["Crepe Bloudan"] = "crepe-nature"

// ── 52 Desserts ──
writeMigration("52", "desserts-content", "52 — Pancakes, Fruit Salads, Snacks, Ice Cream, Cheesecakes, Cakes", [
  { slug: "pancake-nature", tags: ["halal", "contains_milk", "contains_gluten", "popular"], descDe: "Fluffige Pancakes nach Art des Hauses — wählen Sie Ihre Lieblings-Extras.", descAr: "بان كيك طري ومميز — اختر الإضافات المفضلة لديك.", recs: ["Latte Macchiato", "Bloudan Smoothie", "Cheesecake Bloudan"] },
  { slug: "fruit-salad-bloudan", tags: ["halal", "vegetarian", "contains_fruit", "best_seller"], descDe: "Frischer Fruchtsalat Spezialität Bloudan mit saisonalen Früchten und hausgemachter Creme.", descAr: "سلطة فواكه بلودان المميزة مع فواكه موسمية وكريمة خاصة.", recs: ["Bloudan Smoothie", "Mango Smoothie", "Love 66 Shisha"] },
  { slug: "fruit-salad-lotus", tags: ["halal", "vegetarian", "contains_fruit", "popular"], descDe: "Frischer Fruchtsalat mit Lotus-Creme und knusprigen Lotus-Keksen.", descAr: "سلطة فواكه مع كريمة اللوتس وبسكويت اللوتس.", recs: ["Crepe Lotus", "Lotus Cheesecake", "Latte Vanille"] },
  { slug: "fruit-salad-dubai", tags: ["halal", "vegetarian", "contains_fruit", "chef_recommendation"], descDe: "Luxuriöser Fruchtsalat mit Pistaziencreme und Schokolade nach Dubai-Art.", descAr: "سلطة فواكه فاخرة بكريمة الفستق والشوكولا على طريقة دبي.", recs: ["Crepe Dubai", "Dubai Cheesecake", "Maracuja Splash"] },
  { slug: "chips-noix", tags: ["halal", "vegetarian", "contains_nuts"], descDe: "Knusprige Chips serviert mit einer Auswahl gemischter Nüsse.", descAr: "شيبس مقرمش مع تشكيلة من المكسرات.", recs: ["Mate", "Schwarzer Tee", "Mineralwasser"] },
  { slug: "noix", tags: ["halal", "vegetarian", "contains_nuts", "popular"], descDe: "Auswahl gerösteter und gesalzener Nüsse — ideal zum Teilen.", descAr: "تشكيلة مكسرات محمصة ومالحة، مثالية للمشاركة.", recs: ["Arabische Kaffee", "Schwarzer Tee", "Bloudan Shisha"] },
  { slug: "coupe-arabe", tags: ["halal", "contains_milk", "best_seller"], descDe: "Arabisches Eisbecher-Spezial mit Vanilleeis, Pistazien, Rosenwasser und knusprigen Toppings.", descAr: "آيس كريم عربي مميز مع الفانيليا والفستق وماء الورد.", recs: ["Schwarzer Tee", "Arabische Kaffee", "Bloudan Smoothie"] },
  { slug: "eis-vanille", tags: ["halal", "contains_milk", "vegetarian", "kids_friendly"], descDe: "Cremiges Vanilleeis — klassisch und erfrischend.", descAr: "آيس كريم فانيليا كريمي ومنعش.", recs: ["Waffle Ice Cream", "Crepe Schoko", "Hot Chocolate"] },
  { slug: "eis-fraise", tags: ["halal", "contains_milk", "vegetarian", "contains_fruit"], descDe: "Fruchtiges Erdbeereis mit natürlichem Aroma.", descAr: "آيس كريم فراولة بطعم طبيعي.", recs: ["Erdbeer Smoothie", "Erdbeer Milchshake", "Cheesecake Oreo"] },
  { slug: "eis-chocolat", tags: ["halal", "contains_milk", "vegetarian", "contains_chocolate", "popular"], descDe: "Reichhaltiges Schokoladeneis für Schokoladenliebhaber.", descAr: "آيس كريم شوكولا غني ولذيذ.", recs: ["Schoko Milchshake", "Brownie Cake", "Molten Cake"] },
  { slug: "cheesecake-bloudan", tags: ["halal", "contains_milk", "contains_gluten", "best_seller"], descDe: "Cremiger Cheesecake Spezialität Bloudan — Hausrezept.", descAr: "تشيز كيك بلودان الكريمي بوصفة المطعم الخاصة.", recs: ["Bloudan Milkshake", "Latte Macchiato", "Bloudan Smoothie"] },
  { slug: "cheesecake-lotus", tags: ["halal", "contains_milk", "contains_gluten", "popular"], descDe: "Cremiger Cheesecake mit Lotus-Creme und knusprigen Keksen.", descAr: "تشيز كيك باللوتس مع كريمة وبسكويت اللوتس.", recs: ["Crepe Lotus", "Latte Vanille", "Erdbeer Smoothie"] },
  { slug: "cheesecake-dubai", tags: ["halal", "contains_milk", "contains_gluten", "contains_nuts", "chef_recommendation"], descDe: "Luxuriöser Cheesecake mit Pistaziencreme nach Dubai-Art.", descAr: "تشيز كيك فاخر بكريمة الفستق على طريقة دبي.", recs: ["Crepe Dubai", "Maracuja Splash", "Arabische Kaffee"] },
  { slug: "cheesecake-oreo", tags: ["halal", "contains_milk", "contains_gluten", "popular"], descDe: "Cremiger Cheesecake mit Oreo-Keksen und Schokoladensauce.", descAr: "تشيز كيك أوريو مع بسكويت أوريو وصوص الشوكولا.", recs: ["Oreo Milchshake", "Iced Mocha", "Waffle Oreo"] },
  { slug: "molten-cake", tags: ["halal", "contains_milk", "contains_gluten", "contains_chocolate", "popular"], descDe: "Warmer Schokoladen-Lavakuchen mit flüssigem Kern — serviert heiß.", descAr: "كيك شوكولا ساخن بحشوة ذائبة من الداخل.", recs: ["Espresso", "Hot Chocolate", "Vanille Eis"] },
  { slug: "brownie-cake", tags: ["halal", "contains_milk", "contains_gluten", "contains_chocolate", "best_seller"], descDe: "Saftiger Brownie-Kuchen mit intensiver Schokolade.", descAr: "كيك براونيز غني بالشوكола وطري.", recs: ["Schoko Milchshake", "Cappuccino", "Frappuccino"] },
])

REC["Crepe Schoko"] = "crepe-nature"
REC["Bloudan Milkshake"] = "bloudan-milkshake"
REC["Molten Cake"] = "molten-cake"

// ── 53 Shisha ──
writeMigration("53", "shisha-content", "53 — Shisha", [
  { slug: "shisha-bloudan", tags: ["halal", "signature", "best_seller", "premium"], descDe: "Premium Shisha Spezialität Bloudan — ausgewogene Mischung mit langanhaltendem, vollem Rauch.", descAr: "أرجيلة بلودان المميزة — مزيج متوازن ودخان غني يدوم طويلاً.", recs: ["Schwarzer Tee", "Bloudan Smoothie", "Cheesecake Bloudan"] },
  { slug: "shisha-double-apple", tags: ["halal", "classic", "popular"], descDe: "Klassisches Doppel-Apfel-Aroma — der beliebteste Shisha-Klassiker.", descAr: "نكهة التفاحتين الكلاسيكية — الأكثر طلباً.", recs: ["Arabische Kaffee", "Mineralwasser", "Mate"] },
  { slug: "shisha-grape-mint", tags: ["halal", "fruity", "mint", "popular"], descDe: "Erfrischende Mischung aus Traube und Minze.", descAr: "مزيج منعش من العنب والنعناع.", recs: ["Grün Tee", "Mojito", "Fruit Salad Bloudan"] },
  { slug: "shisha-love-66", tags: ["halal", "fruity", "sweet", "popular"], descDe: "Süß-fruchtiges Love 66 Aroma — ein Favorit unter Gästen.", descAr: "نكهة Love 66 الفواكهية الحلوة — من المفضلات.", recs: ["Mojito", "Bloudan Smoothie", "Cheesecake Bloudan"] },
  { slug: "shisha-cinderella", tags: ["halal", "fruity", "sweet"], descDe: "Fruchtiges Cinderella-Aroma mit angenehm süßer Note.", descAr: "نكهة سندريلا الفواكهية بطعم حلو لذيذ.", recs: ["Maracuja Splash", "Erdbeer Smoothie", "Crepe Lotus"] },
  { slug: "shisha-watermelon", tags: ["halal", "fruity", "refreshing"], descDe: "Erfrischendes Wassermelonen-Aroma — ideal für warme Tage.", descAr: "نكهة البطيخ المنعشة — مثالية للأيام الدافئة.", recs: ["Ice Tea Wassermelone", "Mango Smoothie", "Fruit Salad Dubai"] },
  { slug: "shisha-raffaello", tags: ["halal", "sweet", "premium"], descDe: "Cremiges Raffaello-Aroma mit Mandel und Kokosnote.", descAr: "نكهة رافايلو الكريمية مع اللوز وجوز الهند.", recs: ["Ipanema", "Cheesecake Bloudan", "Latte Macchiato"] },
  { slug: "shisha-fruits", tags: ["halal", "fruity", "popular"], descDe: "Bunter Fruchtmix — eine harmonische Mischung tropischer Aromen.", descAr: "مزيج فواكه متنوع بنكهات استوائية متناسقة.", recs: ["Bloudan Smoothie", "Fruit Salad Bloudan", "Mojito"] },
  { slug: "shisha-polo", tags: ["halal", "mint", "refreshing"], descDe: "Erfrischendes Polo-Aroma mit Zitrone und Minze.", descAr: "نكهة بولو المنعشة بالليمون والنعناع.", recs: ["Polo Smoothie", "Grün Tee", "Gemischter Grillteller"] },
  { slug: "shisha-royale", tags: ["halal", "premium", "chef_recommendation", "signature"], descDe: "Premium Shisha Royale — unsere Königsklasse mit exklusiver Tabakmischung und langer Rauchdauer.", descAr: "أرجيلة رويال الفاخرة — تشكيلة تبغ حصرية ودخان يدوم طويلاً.", recs: ["Bloudan Milchshake", "Schwarzer Tee", "Cheesecake Bloudan"] },
])

console.log("\nDone. Register 48–53 in run-migrations.mjs")
