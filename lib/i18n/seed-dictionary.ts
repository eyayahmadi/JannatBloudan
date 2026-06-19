/**
 * Seed dictionary — FR → {EN, DE, AR}
 * ------------------------------------
 * Dictionnaire statique embarqué dans le bundle. Sert de socle de traduction
 * garanti : utilisé en premier par `auto-translate-dom`, `useMt` et
 * `/api/translate-page` AVANT tout appel à DeepL/MyMemory. Cela permet :
 *
 *   - une traduction instantanée des libellés UI fréquents,
 *   - un fonctionnement hors-ligne / sans clé API,
 *   - une résilience face aux quotas DeepL épuisés.
 *
 * Conventions :
 *   - Clé = chaîne française EXACTE telle que rendue dans le DOM (trimmée),
 *     avec apostrophes courbes telles qu'elles apparaissent à l'écran.
 *   - Pour les chaînes paramétrées, on stocke la forme nue ("Table" et non
 *     "Table {n}") — le numéro/identifiant reste collé dans un nœud texte
 *     séparé que l'auto-traducteur ignore.
 *   - Conservez le tri par section (QR, statuts, sidebar, etc.) pour faciliter
 *     l'extension. Ajoutez de nouvelles entrées plutôt que de les éparpiller.
 */

import type { Locale } from "./config"

export type SeedEntry = { en: string; de: string; ar: string }

const SEED: Record<string, SeedEntry> = {
  // ───────────────────────── QR & accueil table ─────────────────────────
  "Bienvenue": { en: "Welcome", de: "Willkommen", ar: "أهلاً بك" },
  "Bonjour": { en: "Hello", de: "Hallo", ar: "مرحباً" },
  "Table": { en: "Table", de: "Tisch", ar: "طاولة" },
  "Session active": { en: "Active session", de: "Aktive Sitzung", ar: "جلسة نشطة" },
  "Aller au contenu principal": {
    en: "Skip to main content",
    de: "Zum Hauptinhalt springen",
    ar: "تخطّي إلى المحتوى الرئيسي",
  },
  "Scannez, commandez, suivez votre repas et payez — sans bouger de votre table. Une expérience signature, toute en finesse.":
    {
      en: "Scan, order, track your meal and pay — all from your table. A signature, refined experience.",
      de: "Scannen, bestellen, Essen verfolgen und zahlen — alles vom Tisch aus. Ein erlesenes Signature-Erlebnis.",
      ar: "امسح، اطلب، تابع وجبتك وادفع — كل ذلك من طاولتك. تجربة استثنائية بكل تفاصيلها.",
    },
  "— une expérience signature —": {
    en: "— a signature experience —",
    de: "— ein Signature-Erlebnis —",
    ar: "— تجربة استثنائية —",
  },

  // ───────────────────────── Actions QR ─────────────────────────
  "Voir le menu": { en: "View menu", de: "Speisekarte ansehen", ar: "عرض القائمة" },
  "Commander en libre-service": {
    en: "Order at your own pace",
    de: "Selbstbestellung",
    ar: "اطلب بنفسك",
  },
  "Suivre ma commande": {
    en: "Track my order",
    de: "Bestellung verfolgen",
    ar: "تتبّع طلبي",
  },
  "Aucune commande active": {
    en: "No active order",
    de: "Keine aktive Bestellung",
    ar: "لا يوجد طلب نشط",
  },
  "Appeler le serveur": {
    en: "Call the server",
    de: "Kellner rufen",
    ar: "نداء النادل",
  },
  "Demande d'assistance à la table": {
    en: "Request table assistance",
    de: "Tischservice anfordern",
    ar: "طلب مساعدة عند الطاولة",
  },
  "Demander l'addition": {
    en: "Request the bill",
    de: "Rechnung anfordern",
    ar: "طلب الفاتورة",
  },
  "Le serveur vous apportera la note": {
    en: "The server will bring your bill",
    de: "Der Kellner bringt Ihnen die Rechnung",
    ar: "سيُحضر النادل الفاتورة",
  },
  "Payer maintenant": {
    en: "Pay now",
    de: "Jetzt bezahlen",
    ar: "ادفع الآن",
  },
  "Carte bancaire / wallet": {
    en: "Card / wallet",
    de: "Karte / Wallet",
    ar: "بطاقة / محفظة",
  },
  "Un serveur a été appelé": {
    en: "A server has been called",
    de: "Ein Kellner wurde gerufen",
    ar: "تم استدعاء النادل",
  },
  "Addition demandée": {
    en: "Bill requested",
    de: "Rechnung angefordert",
    ar: "تم طلب الفاتورة",
  },
  "en attente": { en: "pending", de: "wartet", ar: "قيد الانتظار" },
  "Le serveur est prévenu, il arrive 👋": {
    en: "The server has been notified — on the way 👋",
    de: "Der Kellner wurde benachrichtigt — er kommt gleich 👋",
    ar: "تم إخطار النادل، في الطريق 👋",
  },
  "Votre addition est en cours de préparation 🧾": {
    en: "Your bill is being prepared 🧾",
    de: "Ihre Rechnung wird vorbereitet 🧾",
    ar: "جاري تحضير فاتورتك 🧾",
  },
  "Cette table est désactivée. Contactez l'équipe pour être reassis.": {
    en: "This table is disabled. Please contact the team to be reseated.",
    de: "Dieser Tisch ist deaktiviert. Bitte wenden Sie sich an das Team.",
    ar: "هذه الطاولة معطّلة. يُرجى التواصل مع الفريق لإعادة الجلوس.",
  },
  "Commande": { en: "Order", de: "Bestellung", ar: "طلب" },
  "Commandes": { en: "Orders", de: "Bestellungen", ar: "طلبات" },
  "articles": { en: "items", de: "Artikel", ar: "أصناف" },

  // ───────────────────────── Statuts commande ─────────────────────────
  "Reçue": { en: "Received", de: "Empfangen", ar: "مُستلمة" },
  "En préparation": { en: "In preparation", de: "In Zubereitung", ar: "قيد التحضير" },
  "Prête": { en: "Ready", de: "Fertig", ar: "جاهزة" },
  "Prêt": { en: "Ready", de: "Fertig", ar: "جاهز" },
  "En service": { en: "Serving", de: "Wird serviert", ar: "قيد التقديم" },
  "Terminée": { en: "Completed", de: "Abgeschlossen", ar: "مكتملة" },
  "Terminé": { en: "Completed", de: "Abgeschlossen", ar: "مكتمل" },
  "Annulée": { en: "Cancelled", de: "Storniert", ar: "ملغاة" },
  "Annulé": { en: "Cancelled", de: "Storniert", ar: "ملغى" },
  "En cours": { en: "In progress", de: "Läuft", ar: "قيد التنفيذ" },
  "Servi": { en: "Served", de: "Serviert", ar: "تم التقديم" },
  "En attente": { en: "Pending", de: "Ausstehend", ar: "قيد الانتظار" },
  "Confirmé": { en: "Confirmed", de: "Bestätigt", ar: "مؤكَّد" },
  "Confirmée": { en: "Confirmed", de: "Bestätigt", ar: "مؤكَّدة" },
  "Refusé": { en: "Declined", de: "Abgelehnt", ar: "مرفوض" },
  "Refusée": { en: "Declined", de: "Abgelehnt", ar: "مرفوضة" },
  "Disponible": { en: "Available", de: "Verfügbar", ar: "متوفّر" },
  "Indisponible": { en: "Unavailable", de: "Nicht verfügbar", ar: "غير متوفّر" },
  "Actif": { en: "Active", de: "Aktiv", ar: "نشط" },
  "Inactif": { en: "Inactive", de: "Inaktiv", ar: "غير نشط" },
  "Brouillon": { en: "Draft", de: "Entwurf", ar: "مسودّة" },
  "Publié": { en: "Published", de: "Veröffentlicht", ar: "منشور" },
  "Archivé": { en: "Archived", de: "Archiviert", ar: "مؤرشف" },

  // ───────────────────────── Paiements ─────────────────────────
  "Payé": { en: "Paid", de: "Bezahlt", ar: "مدفوع" },
  "Impayé": { en: "Unpaid", de: "Unbezahlt", ar: "غير مدفوع" },
  "Partiellement payé": { en: "Partially paid", de: "Teilweise bezahlt", ar: "مدفوع جزئيًا" },
  "À crédit": { en: "On credit", de: "Auf Kredit", ar: "بالدّين" },
  "En retard": { en: "Overdue", de: "Überfällig", ar: "متأخّر" },
  "Crédit": { en: "Credit", de: "Kredit", ar: "دَين" },
  "Espèces": { en: "Cash", de: "Bargeld", ar: "نقدًا" },
  "Carte bancaire": { en: "Bank card", de: "Bankkarte", ar: "بطاقة بنكية" },
  "Carte": { en: "Card", de: "Karte", ar: "بطاقة" },
  "Virement": { en: "Bank transfer", de: "Überweisung", ar: "تحويل بنكي" },
  "Mobile": { en: "Mobile", de: "Mobil", ar: "محفظة إلكترونية" },
  "Chèque": { en: "Cheque", de: "Scheck", ar: "شيك" },
  "Méthode de paiement": { en: "Payment method", de: "Zahlungsart", ar: "وسيلة الدفع" },
  "Total": { en: "Total", de: "Summe", ar: "المجموع" },
  "Sous-total": { en: "Subtotal", de: "Zwischensumme", ar: "المجموع الفرعي" },
  "TVA": { en: "VAT", de: "MwSt.", ar: "ضريبة القيمة المضافة" },
  "Remise": { en: "Discount", de: "Rabatt", ar: "خصم" },
  "Pourboire": { en: "Tip", de: "Trinkgeld", ar: "إكرامية" },
  "Montant": { en: "Amount", de: "Betrag", ar: "المبلغ" },
  "Reste à payer": { en: "Remaining to pay", de: "Restbetrag", ar: "المتبقّي" },

  // ───────────────────────── Boutons & actions communes ─────────────────────────
  "Voir": { en: "View", de: "Ansehen", ar: "عرض" },
  "Voir plus": { en: "See more", de: "Mehr anzeigen", ar: "عرض المزيد" },
  "Voir tout": { en: "See all", de: "Alle anzeigen", ar: "عرض الكل" },
  "Ajouter": { en: "Add", de: "Hinzufügen", ar: "إضافة" },
  "Modifier": { en: "Edit", de: "Bearbeiten", ar: "تعديل" },
  "Supprimer": { en: "Delete", de: "Löschen", ar: "حذف" },
  "Enregistrer": { en: "Save", de: "Speichern", ar: "حفظ" },
  "Sauvegarder": { en: "Save", de: "Speichern", ar: "حفظ" },
  "Annuler": { en: "Cancel", de: "Abbrechen", ar: "إلغاء" },
  "Confirmer": { en: "Confirm", de: "Bestätigen", ar: "تأكيد" },
  "Valider": { en: "Validate", de: "Bestätigen", ar: "تأكيد" },
  "Fermer": { en: "Close", de: "Schließen", ar: "إغلاق" },
  "Continuer": { en: "Continue", de: "Weiter", ar: "متابعة" },
  "Suivant": { en: "Next", de: "Weiter", ar: "التالي" },
  "Précédent": { en: "Previous", de: "Zurück", ar: "السابق" },
  "Retour": { en: "Back", de: "Zurück", ar: "رجوع" },
  "Quitter": { en: "Exit", de: "Beenden", ar: "خروج" },
  "Réessayer": { en: "Retry", de: "Erneut versuchen", ar: "إعادة المحاولة" },
  "Imprimer": { en: "Print", de: "Drucken", ar: "طباعة" },
  "Exporter": { en: "Export", de: "Exportieren", ar: "تصدير" },
  "Importer": { en: "Import", de: "Importieren", ar: "استيراد" },
  "Télécharger": { en: "Download", de: "Herunterladen", ar: "تنزيل" },
  "Envoyer": { en: "Send", de: "Senden", ar: "إرسال" },
  "Rechercher": { en: "Search", de: "Suchen", ar: "بحث" },
  "Filtrer": { en: "Filter", de: "Filtern", ar: "تصفية" },
  "Trier": { en: "Sort", de: "Sortieren", ar: "ترتيب" },
  "Réinitialiser": { en: "Reset", de: "Zurücksetzen", ar: "إعادة التعيين" },
  "Effacer": { en: "Clear", de: "Leeren", ar: "مسح" },
  "Sélectionner": { en: "Select", de: "Auswählen", ar: "اختيار" },
  "Tout sélectionner": { en: "Select all", de: "Alle auswählen", ar: "اختيار الكل" },
  "Copier": { en: "Copy", de: "Kopieren", ar: "نسخ" },
  "Coller": { en: "Paste", de: "Einfügen", ar: "لصق" },
  "Actualiser": { en: "Refresh", de: "Aktualisieren", ar: "تحديث" },
  "Charger plus": { en: "Load more", de: "Mehr laden", ar: "تحميل المزيد" },
  "Détails": { en: "Details", de: "Details", ar: "تفاصيل" },
  "Plus": { en: "More", de: "Mehr", ar: "المزيد" },
  "Moins": { en: "Less", de: "Weniger", ar: "أقل" },
  "Oui": { en: "Yes", de: "Ja", ar: "نعم" },
  "Non": { en: "No", de: "Nein", ar: "لا" },
  "OK": { en: "OK", de: "OK", ar: "موافق" },

  // ───────────────────────── Menu / filtres / catégories ─────────────────────────
  "Rechercher…": { en: "Search…", de: "Suchen…", ar: "بحث…" },
  "Rechercher...": { en: "Search...", de: "Suchen...", ar: "بحث..." },
  "Réinitialiser filtres": {
    en: "Reset filters",
    de: "Filter zurücksetzen",
    ar: "إعادة ضبط الفلاتر",
  },
  "Filtres": { en: "Filters", de: "Filter", ar: "الفلاتر" },
  "FILTRES": { en: "FILTERS", de: "FILTER", ar: "الفلاتر" },
  "Filtre": { en: "Filter", de: "Filter", ar: "فلتر" },
  "Tout": { en: "All", de: "Alle", ar: "الكل" },
  "Plats": { en: "Dishes", de: "Gerichte", ar: "الأطباق" },
  "Desserts": { en: "Desserts", de: "Desserts", ar: "الحلويات" },
  "Boissons": { en: "Drinks", de: "Getränke", ar: "المشروبات" },
  "Boisson": { en: "Drink", de: "Getränk", ar: "مشروب" },
  "Chicha": { en: "Shisha", de: "Shisha", ar: "الشيشة" },
  "Mezzes": { en: "Mezzes", de: "Mezze", ar: "المقبلات" },
  "Grillades": { en: "Grilled", de: "Gegrilltes", ar: "المشاوي" },
  "Salades": { en: "Salads", de: "Salate", ar: "السلطات" },
  "Spécialités": { en: "Specialties", de: "Spezialitäten", ar: "التخصّصات" },
  "Toutes les catégories": {
    en: "All categories",
    de: "Alle Kategorien",
    ar: "كل الفئات",
  },
  "Toutes les stations": {
    en: "All stations",
    de: "Alle Stationen",
    ar: "كل المحطات",
  },
  "Station": { en: "Station", de: "Station", ar: "محطّة" },
  "Tri": { en: "Sort", de: "Sortierung", ar: "ترتيب" },
  "Trier par": { en: "Sort by", de: "Sortieren nach", ar: "ترتيب حسب" },
  "Nom (A–Z)": { en: "Name (A–Z)", de: "Name (A–Z)", ar: "الاسم (أ–ي)" },
  "Nom (Z–A)": { en: "Name (Z–A)", de: "Name (Z–A)", ar: "الاسم (ي–أ)" },
  "Prix croissant": { en: "Price ascending", de: "Preis aufsteigend", ar: "السعر تصاعدي" },
  "Prix décroissant": { en: "Price descending", de: "Preis absteigend", ar: "السعر تنازلي" },
  "Disponibles seulement": {
    en: "Available only",
    de: "Nur verfügbare",
    ar: "المتوفّر فقط",
  },
  "Nouveautés seulement": {
    en: "New only",
    de: "Nur Neuheiten",
    ar: "الجديد فقط",
  },
  "Populaires seulement": {
    en: "Popular only",
    de: "Nur Beliebte",
    ar: "الأكثر طلبًا فقط",
  },
  "Épicé": { en: "Spicy", de: "Scharf", ar: "حار" },
  "Doux": { en: "Mild", de: "Mild", ar: "خفيف" },
  "Bio": { en: "Organic", de: "Bio", ar: "عضوي" },
  "Maison": { en: "Homemade", de: "Hausgemacht", ar: "صنع المنزل" },
  "Les plus commandés": {
    en: "Most ordered",
    de: "Am häufigsten bestellt",
    ar: "الأكثر طلبًا",
  },
  "Best-sellers": { en: "Best-sellers", de: "Bestseller", ar: "الأكثر مبيعًا" },
  "Similaires": { en: "Similar", de: "Ähnlich", ar: "مشابه" },
  "Populaire": { en: "Popular", de: "Beliebt", ar: "الأكثر طلبًا" },
  "Notre carte": { en: "Our menu", de: "Unsere Karte", ar: "قائمتنا" },
  "Mezzes, grillades, manakish, desserts orientaux — préparés chaque jour avec des ingrédients frais.":
    {
      en: "Mezzes, grills, manakish, oriental desserts — prepared daily with fresh ingredients.",
      de: "Mezze, Grillgerichte, Manakish, orientalische Desserts — täglich frisch zubereitet.",
      ar: "مقبلات، مشاوي، مناقيش، حلويات شرقية — تُحضّر يوميًا بمكوّنات طازجة.",
    },

  // ───────────────────────── En-tête / footer / SEO ─────────────────────────
  "Restaurant syrien authentique": {
    en: "Authentic Syrian restaurant",
    de: "Authentisches syrisches Restaurant",
    ar: "مطعم سوري أصيل",
  },
  "Cuisine syrienne authentique": {
    en: "Authentic Syrian cuisine",
    de: "Authentische syrische Küche",
    ar: "مطبخ سوري أصيل",
  },
  "Mentions légales": { en: "Legal notice", de: "Impressum", ar: "إشعار قانوني" },
  "Politique de confidentialité": {
    en: "Privacy policy",
    de: "Datenschutz",
    ar: "سياسة الخصوصية",
  },
  "Conditions d'utilisation": {
    en: "Terms of use",
    de: "Nutzungsbedingungen",
    ar: "شروط الاستخدام",
  },
  "Tous droits réservés": {
    en: "All rights reserved",
    de: "Alle Rechte vorbehalten",
    ar: "جميع الحقوق محفوظة",
  },
  "Suivez-nous": { en: "Follow us", de: "Folgen Sie uns", ar: "تابعنا" },

  // ───────────────────────── Sidebar / navigation ─────────────────────────
  "Accueil": { en: "Home", de: "Startseite", ar: "الرئيسية" },
  "Menu": { en: "Menu", de: "Speisekarte", ar: "القائمة" },
  // "Carte" déjà défini plus haut dans la section paiements.
  "Réservation": { en: "Booking", de: "Reservierung", ar: "حجز" },
  "Réservations": { en: "Bookings", de: "Reservierungen", ar: "حجوزات" },
  "Événements": { en: "Events", de: "Veranstaltungen", ar: "فعاليات" },
  "Livraison": { en: "Delivery", de: "Lieferung", ar: "توصيل" },
  "À propos": { en: "About", de: "Über uns", ar: "من نحن" },
  "A propos": { en: "About us", de: "Über uns", ar: "من نحن" },
  "Découvrir": { en: "Discover", de: "Entdecken", ar: "اكتشف" },
  "Contact": { en: "Contact", de: "Kontakt", ar: "اتصل بنا" },
  "Tableau de bord": { en: "Dashboard", de: "Übersicht", ar: "لوحة التحكم" },
  "Statistiques": { en: "Statistics", de: "Statistiken", ar: "إحصائيات" },
  "Rapports": { en: "Reports", de: "Berichte", ar: "تقارير" },
  "Paramètres": { en: "Settings", de: "Einstellungen", ar: "الإعدادات" },
  "Configuration": { en: "Configuration", de: "Konfiguration", ar: "تهيئة" },
  "Profil": { en: "Profile", de: "Profil", ar: "الملف الشخصي" },
  "Mon compte": { en: "My account", de: "Mein Konto", ar: "حسابي" },
  "Compte": { en: "Account", de: "Konto", ar: "حساب" },
  "Déconnexion": { en: "Sign out", de: "Abmelden", ar: "تسجيل الخروج" },
  "Se déconnecter": { en: "Sign out", de: "Abmelden", ar: "تسجيل الخروج" },
  "Connexion": { en: "Sign in", de: "Anmelden", ar: "تسجيل الدخول" },
  "Se connecter": { en: "Sign in", de: "Anmelden", ar: "تسجيل الدخول" },
  "Inscription": { en: "Sign up", de: "Registrieren", ar: "تسجيل" },
  "S'inscrire": { en: "Sign up", de: "Registrieren", ar: "تسجيل" },
  "Notifications": { en: "Notifications", de: "Benachrichtigungen", ar: "إشعارات" },
  "Boîte de réception": { en: "Inbox", de: "Posteingang", ar: "صندوق الوارد" },
  "Stock": { en: "Stock", de: "Lager", ar: "المخزون" },
  "Stocks": { en: "Stocks", de: "Lager", ar: "المخزون" },
  "Inventaire": { en: "Inventory", de: "Inventar", ar: "الجرد" },
  "Caisse": { en: "Cash register", de: "Kasse", ar: "الصندوق" },
  "Cuisine": { en: "Kitchen", de: "Küche", ar: "المطبخ" },
  "Bar": { en: "Bar", de: "Bar", ar: "البار" },
  "Shisha": { en: "Shisha", de: "Shisha", ar: "الشيشة" },
  "Salle": { en: "Dining room", de: "Saal", ar: "صالة" },
  "Personnel": { en: "Staff", de: "Personal", ar: "الموظفون" },
  "Clients": { en: "Customers", de: "Kunden", ar: "العملاء" },
  "Fournisseurs": { en: "Suppliers", de: "Lieferanten", ar: "الموردون" },
  "Factures": { en: "Invoices", de: "Rechnungen", ar: "الفواتير" },
  "Facture": { en: "Invoice", de: "Rechnung", ar: "فاتورة" },
  "Tickets": { en: "Tickets", de: "Belege", ar: "إيصالات" },
  "Produits": { en: "Products", de: "Produkte", ar: "المنتجات" },
  "Produit": { en: "Product", de: "Produkt", ar: "منتج" },
  "Catégories": { en: "Categories", de: "Kategorien", ar: "الفئات" },
  "Catégorie": { en: "Category", de: "Kategorie", ar: "فئة" },
  "Articles": { en: "Items", de: "Artikel", ar: "العناصر" },
  "Article": { en: "Item", de: "Artikel", ar: "عنصر" },
  "Tables": { en: "Tables", de: "Tische", ar: "الطاولات" },
  "QR codes": { en: "QR codes", de: "QR-Codes", ar: "رموز QR" },

  // ───────────────────────── Rôles ─────────────────────────
  "Administrateur": { en: "Administrator", de: "Administrator", ar: "مدير" },
  "Admin": { en: "Admin", de: "Admin", ar: "مدير" },
  "Manager": { en: "Manager", de: "Manager", ar: "مسؤول" },
  "Serveur": { en: "Server", de: "Kellner", ar: "نادل" },
  "Cuisinier": { en: "Cook", de: "Koch", ar: "طبّاخ" },
  "Chef": { en: "Chef", de: "Chefkoch", ar: "شيف" },
  "Barman": { en: "Bartender", de: "Barkeeper", ar: "نادل البار" },
  "Caissier": { en: "Cashier", de: "Kassierer", ar: "أمين الصندوق" },
  "Livreur": { en: "Driver", de: "Fahrer", ar: "سائق توصيل" },
  "Client": { en: "Customer", de: "Kunde", ar: "عميل" },

  // ───────────────────────── Formulaires & erreurs ─────────────────────────
  "Nom": { en: "Name", de: "Name", ar: "الاسم" },
  "Prénom": { en: "First name", de: "Vorname", ar: "الاسم الأول" },
  "E-mail": { en: "E-mail", de: "E-Mail", ar: "البريد الإلكتروني" },
  "Email": { en: "Email", de: "E-Mail", ar: "البريد الإلكتروني" },
  "Téléphone": { en: "Phone", de: "Telefon", ar: "الهاتف" },
  "Adresse": { en: "Address", de: "Adresse", ar: "العنوان" },
  "Code postal": { en: "Postal code", de: "Postleitzahl", ar: "الرمز البريدي" },
  "Ville": { en: "City", de: "Stadt", ar: "المدينة" },
  "Pays": { en: "Country", de: "Land", ar: "البلد" },
  "Mot de passe": { en: "Password", de: "Passwort", ar: "كلمة المرور" },
  "Confirmer le mot de passe": {
    en: "Confirm password",
    de: "Passwort bestätigen",
    ar: "تأكيد كلمة المرور",
  },
  "Note": { en: "Note", de: "Notiz", ar: "ملاحظة" },
  "Notes": { en: "Notes", de: "Notizen", ar: "ملاحظات" },
  "Description": { en: "Description", de: "Beschreibung", ar: "الوصف" },
  "Quantité": { en: "Quantity", de: "Menge", ar: "الكمية" },
  "Prix": { en: "Price", de: "Preis", ar: "السعر" },
  "Date": { en: "Date", de: "Datum", ar: "التاريخ" },
  "Heure": { en: "Time", de: "Uhrzeit", ar: "الوقت" },
  "Aujourd'hui": { en: "Today", de: "Heute", ar: "اليوم" },
  "Hier": { en: "Yesterday", de: "Gestern", ar: "أمس" },
  "Demain": { en: "Tomorrow", de: "Morgen", ar: "غدًا" },
  "Cette semaine": { en: "This week", de: "Diese Woche", ar: "هذا الأسبوع" },
  "Ce mois": { en: "This month", de: "Diesen Monat", ar: "هذا الشهر" },
  "Cette année": { en: "This year", de: "Dieses Jahr", ar: "هذه السنة" },
  "Champ obligatoire": { en: "Required field", de: "Pflichtfeld", ar: "حقل إلزامي" },
  "Obligatoire": { en: "Required", de: "Pflicht", ar: "إلزامي" },
  "Facultatif": { en: "Optional", de: "Optional", ar: "اختياري" },
  "Une erreur est survenue": {
    en: "An error occurred",
    de: "Ein Fehler ist aufgetreten",
    ar: "حدث خطأ",
  },
  "Veuillez réessayer": {
    en: "Please try again",
    de: "Bitte erneut versuchen",
    ar: "يُرجى المحاولة مرة أخرى",
  },
  "Chargement…": { en: "Loading…", de: "Lädt …", ar: "جارٍ التحميل…" },
  "Chargement...": { en: "Loading...", de: "Lädt...", ar: "جارٍ التحميل..." },
  "Aucun résultat": { en: "No results", de: "Keine Ergebnisse", ar: "لا توجد نتائج" },
  "Aucune donnée": { en: "No data", de: "Keine Daten", ar: "لا توجد بيانات" },
  "Aucune commande": { en: "No orders", de: "Keine Bestellungen", ar: "لا توجد طلبات" },
  "Aucun produit": { en: "No products", de: "Keine Produkte", ar: "لا توجد منتجات" },
  "Aucun client": { en: "No customers", de: "Keine Kunden", ar: "لا يوجد عملاء" },
  "Aucune facture": { en: "No invoices", de: "Keine Rechnungen", ar: "لا توجد فواتير" },
  "Aucune réservation": { en: "No bookings", de: "Keine Reservierungen", ar: "لا توجد حجوزات" },
  "Aucune notification": { en: "No notifications", de: "Keine Benachrichtigungen", ar: "لا توجد إشعارات" },
  "Connecté": { en: "Connected", de: "Verbunden", ar: "متّصل" },
  "Déconnecté": { en: "Disconnected", de: "Getrennt", ar: "غير متّصل" },
  "Hors ligne": { en: "Offline", de: "Offline", ar: "غير متّصل" },
  "En ligne": { en: "Online", de: "Online", ar: "متّصل" },

  // ───────────────────────── Menu / marketing ─────────────────────────
  "Découvrir le menu": { en: "Discover the menu", de: "Speisekarte entdecken", ar: "اكتشف القائمة" },
  "Réserver une table": { en: "Book a table", de: "Tisch reservieren", ar: "احجز طاولة" },
  "Réserver": { en: "Book", de: "Reservieren", ar: "احجز" },
  "Commander": { en: "Order", de: "Bestellen", ar: "اطلب" },
  "Commander en ligne": { en: "Order online", de: "Online bestellen", ar: "اطلب عبر الإنترنت" },
  "Nos spécialités": { en: "Our specialties", de: "Unsere Spezialitäten", ar: "تخصّصاتنا" },
  "Notre histoire": { en: "Our story", de: "Unsere Geschichte", ar: "قصّتنا" },
  "Galerie": { en: "Gallery", de: "Galerie", ar: "المعرض" },
  "Avis": { en: "Reviews", de: "Bewertungen", ar: "آراء العملاء" },
  "Voir le panier": { en: "View cart", de: "Warenkorb ansehen", ar: "عرض السلة" },
  "Panier": { en: "Cart", de: "Warenkorb", ar: "السلة" },
  "Vider le panier": { en: "Empty cart", de: "Warenkorb leeren", ar: "إفراغ السلة" },
  "Ajouter au panier": { en: "Add to cart", de: "In den Warenkorb", ar: "أضف إلى السلة" },
  "Recommandés": { en: "Recommended", de: "Empfohlen", ar: "موصى به" },
  "Populaires": { en: "Popular", de: "Beliebt", ar: "الأكثر طلبًا" },
  "Choix du chef": { en: "Chef's choice", de: "Chef's Choice", ar: "اختيار الشيف" },
  "Nouveautés": { en: "New", de: "Neu", ar: "الجديد" },
  "Promotions": { en: "Promotions", de: "Aktionen", ar: "عروض" },
  "Allergènes": { en: "Allergens", de: "Allergene", ar: "مسبّبات الحساسية" },
  "Végétarien": { en: "Vegetarian", de: "Vegetarisch", ar: "نباتي" },
  "Végan": { en: "Vegan", de: "Vegan", ar: "نباتي صرف" },
  "Sans gluten": { en: "Gluten-free", de: "Glutenfrei", ar: "خالٍ من الغلوتين" },
  "Halal": { en: "Halal", de: "Halal", ar: "حلال" },

  // ───────────────────────── Caisse / paiement / facturation ─────────────────────────
  "Encaisser": { en: "Take payment", de: "Kassieren", ar: "تحصيل" },
  "Reçu": { en: "Receipt", de: "Beleg", ar: "إيصال" },
  "Reçus": { en: "Receipts", de: "Belege", ar: "إيصالات" },
  "Clôture de caisse": { en: "Close register", de: "Kassenabschluss", ar: "إقفال الصندوق" },
  "Ouverture de caisse": { en: "Open register", de: "Kasse öffnen", ar: "فتح الصندوق" },
  "Caisse du jour": { en: "Today's register", de: "Tageskasse", ar: "صندوق اليوم" },
  "Recette": { en: "Revenue", de: "Umsatz", ar: "الإيرادات" },
  "Recettes": { en: "Revenue", de: "Umsätze", ar: "الإيرادات" },
  "Dépense": { en: "Expense", de: "Ausgabe", ar: "مصروف" },
  "Dépenses": { en: "Expenses", de: "Ausgaben", ar: "مصروفات" },
  "Bilan": { en: "Summary", de: "Bilanz", ar: "الحصيلة" },

  // ───────────────────────── Time / quantity / misc ─────────────────────────
  "Personnes": { en: "Guests", de: "Personen", ar: "أشخاص" },
  "Personne": { en: "Guest", de: "Person", ar: "شخص" },
  "min": { en: "min", de: "Min.", ar: "د" },
  "Tous": { en: "All", de: "Alle", ar: "الكل" },
  "Toutes": { en: "All", de: "Alle", ar: "الكل" },
  "Aucun": { en: "None", de: "Keiner", ar: "لا شيء" },
  "Aucune": { en: "None", de: "Keine", ar: "لا شيء" },
  "Statut": { en: "Status", de: "Status", ar: "الحالة" },
  "Type": { en: "Type", de: "Typ", ar: "النوع" },
  "Action": { en: "Action", de: "Aktion", ar: "إجراء" },
  "Actions": { en: "Actions", de: "Aktionen", ar: "إجراءات" },
  "Période": { en: "Period", de: "Zeitraum", ar: "الفترة" },
}

function normalizeKey(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

/**
 * Renvoie le dictionnaire FR → cible pour la locale demandée.
 * Pour `fr` ou clé inconnue : retourne un objet vide.
 */
export function getSeedDictionary(locale: Locale): Record<string, string> {
  if (locale === "fr") return {}
  const out: Record<string, string> = {}
  for (const [fr, entry] of Object.entries(SEED)) {
    const value = entry[locale as "en" | "de" | "ar"]
    if (typeof value === "string" && value.length > 0) {
      out[fr] = value
    }
  }
  return out
}

/**
 * Recherche tolérante : essaye la chaîne brute, puis sa version trimée +
 * whitespace normalisé. Renvoie `undefined` si non trouvée.
 */
export function lookupSeed(
  locale: Locale,
  text: string,
): string | undefined {
  if (locale === "fr" || !text) return undefined
  const dict = getSeedDictionary(locale)
  if (dict[text]) return dict[text]
  const norm = normalizeKey(text)
  if (dict[norm]) return dict[norm]
  return undefined
}

/** Liste plate des clés françaises connues (pour audit / tests). */
export function listSeedFrenchSources(): string[] {
  return Object.keys(SEED)
}

/** Test rapide : la clé française est-elle déjà couverte par le dictionnaire ? */
export function hasSeedTranslation(text: string): boolean {
  if (!text) return false
  return Object.prototype.hasOwnProperty.call(SEED, normalizeKey(text))
}
