/**
 * Seed 5 fictional public profiles to test the multi-user / social experience.
 *
 * ADDITIVE & idempotent: it never touches your own account. It deletes only the
 * five test users (by username) before re-creating them, so re-running is safe.
 * Cities and districts are SHARED catalog rows — we reuse existing ones (so the
 * same city ends up rated by several people, which is the whole point of the
 * social test) and only create the ones that don't exist yet.
 *
 * Run against the LOCAL dev DB (your .env points at prod!):
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/city_ranking \
 *     npx tsx prisma/seed-testusers.ts
 */
import { PrismaClient, DistrictFrequency, VenueType } from "@prisma/client";

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────
type CitySeed = {
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
};

// Find a city by name+country (reuse for social overlap), else create it.
async function getOrCreateCity(c: CitySeed) {
  const existing = await prisma.city.findFirst({
    where: { name: c.name, country: c.country },
  });
  if (existing) return existing;
  return prisma.city.create({ data: c });
}

// District catalog entry, unique per [cityId, name].
async function getOrCreateDistrict(
  cityId: string,
  name: string,
  latitude: number,
  longitude: number
) {
  return prisma.district.upsert({
    where: { cityId_name: { cityId, name } },
    update: {},
    create: { cityId, name, latitude, longitude },
  });
}

const d = (iso: string) => new Date(iso);

// ── persona definitions ──────────────────────────────────────────────────
// Each entry: the user, their visits (with city + rating + flavour), optional
// districts per visit, and their standalone Places (venues).
type VisitSeed = {
  city: CitySeed;
  rating: number;
  startDate: string;
  endDate?: string;
  comment?: string;
  tripType?: string;
  budgetLevel?: string;
  wouldReturn?: boolean;
  highlights?: string;
  transport?: string;
  districts?: {
    name: string;
    lat: number;
    lng: number;
    rating: number;
    frequency: DistrictFrequency;
  }[];
};

type VenueSeed = {
  name: string;
  type: VenueType;
  rating: number;
  location?: string;
  priceLevel?: string;
  note?: string;
  wouldReturn?: boolean;
};

type Persona = {
  username: string;
  name: string;
  email: string;
  bio: string;
  visits: VisitSeed[];
  venues: VenueSeed[];
};

// Reusable city literals (reuse the German names already in the DB where I want
// overlap with your own profile + between personas).
const C = {
  tokyo: { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, population: 13960000, timezone: "Asia/Tokyo" },
  singapore: { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, population: 5686000, timezone: "Asia/Singapore" },
  seoul: { name: "Seoul", country: "South Korea", latitude: 37.5665, longitude: 126.978, population: 9776000, timezone: "Asia/Seoul" },
  taipei: { name: "Taipei", country: "Taiwan", latitude: 25.033, longitude: 121.5654, population: 2646000, timezone: "Asia/Taipei" },
  hongkong: { name: "Hong Kong", country: "China (SAR)", latitude: 22.3193, longitude: 114.1694, population: 7500700, timezone: "Asia/Hong_Kong" },
  bangkok: { name: "Bangkok", country: "Thailand", latitude: 13.7563, longitude: 100.5018, population: 10539000, timezone: "Asia/Bangkok" },
  lisbon: { name: "Lisbon", country: "Portugal", latitude: 38.7223, longitude: -9.1393, population: 547000, timezone: "Europe/Lisbon" },
  porto: { name: "Porto", country: "Portugal", latitude: 41.1579, longitude: -8.6291, population: 231000, timezone: "Europe/Lisbon" },
  prag: { name: "Prag", country: "Czech Republic", latitude: 50.0755, longitude: 14.4378, population: 1335084, timezone: "Europe/Prague" },
  krakow: { name: "Kraków", country: "Poland", latitude: 50.0647, longitude: 19.945, population: 779000, timezone: "Europe/Warsaw" },
  hanoi: { name: "Hanoi", country: "Vietnam", latitude: 21.0278, longitude: 105.8342, population: 8054000, timezone: "Asia/Bangkok" },
  chiangmai: { name: "Chiang Mai", country: "Thailand", latitude: 18.7883, longitude: 98.9853, population: 127000, timezone: "Asia/Bangkok" },
  tbilisi: { name: "Tbilisi", country: "Georgia", latitude: 41.7151, longitude: 44.8271, population: 1118000, timezone: "Asia/Tbilisi" },
  barcelona: { name: "Barcelona", country: "Spain", latitude: 41.3851, longitude: 2.1734, population: 1620000, timezone: "Europe/Madrid" },
  copenhagen: { name: "Copenhagen", country: "Denmark", latitude: 55.6761, longitude: 12.5683, population: 638000, timezone: "Europe/Copenhagen" },
  wien: { name: "Wien", country: "Austria", latitude: 48.2082, longitude: 16.3738, population: 1911191, timezone: "Europe/Vienna" },
  rom: { name: "Rom", country: "Italy", latitude: 41.9028, longitude: 12.4964, population: 2873000, timezone: "Europe/Rome" },
  milan: { name: "Milan", country: "Italy", latitude: 45.4642, longitude: 9.19, population: 1396000, timezone: "Europe/Rome" },
  mexico: { name: "Mexico City", country: "Mexico", latitude: 19.4326, longitude: -99.1332, population: 9209000, timezone: "America/Mexico_City" },
  buenosaires: { name: "Buenos Aires", country: "Argentina", latitude: -34.6037, longitude: -58.3816, population: 3075000, timezone: "America/Argentina/Buenos_Aires" },
  medellin: { name: "Medellín", country: "Colombia", latitude: 6.2476, longitude: -75.5658, population: 2569000, timezone: "America/Bogota" },
  capetown: { name: "Cape Town", country: "South Africa", latitude: -33.9249, longitude: 18.4241, population: 4618000, timezone: "Africa/Johannesburg" },
  lima: { name: "Lima", country: "Peru", latitude: -12.0464, longitude: -77.0428, population: 9752000, timezone: "America/Lima" },
  berlin: { name: "Berlin", country: "Germany", latitude: 52.52, longitude: 13.405, population: 3748148, timezone: "Europe/Berlin" },
  amsterdam: { name: "Amsterdam", country: "Netherlands", state: "North Holland", latitude: 52.3676, longitude: 4.9041, population: 907976, timezone: "Europe/Amsterdam" },
  warsaw: { name: "Warsaw", country: "Poland", latitude: 52.2297, longitude: 21.0122, population: 1790000, timezone: "Europe/Warsaw" },
  hamburg: { name: "Hamburg", country: "Germany", latitude: 53.5511, longitude: 9.9937, population: 1945532, timezone: "Europe/Berlin" },
} as const;

const personas: Persona[] = [
  // ───────────────────────────────────────────────────────── Maya ──────────
  {
    username: "maya",
    name: "Maya Chen",
    email: "maya.chen@example.com",
    bio: "Digital nomad chasing skylines & specialty coffee ☕🌏 Currently: Singapore. Asia is home.",
    visits: [
      {
        city: C.tokyo,
        rating: 96,
        startDate: "2024-04-10",
        endDate: "2024-05-20",
        comment: "The gold standard. Endless, safe, immaculate — and the food never misses.",
        tripType: "solo",
        budgetLevel: "mid",
        wouldReturn: true,
        districts: [
          { name: "Shibuya", lat: 35.6595, lng: 139.7005, rating: 92, frequency: DistrictFrequency.A_LOT },
          { name: "Shinjuku", lat: 35.6938, lng: 139.7035, rating: 88, frequency: DistrictFrequency.FEW_TIMES },
          { name: "Shimokitazawa", lat: 35.6613, lng: 139.6679, rating: 95, frequency: DistrictFrequency.BASED_HERE },
        ],
      },
      {
        city: C.singapore,
        rating: 91,
        startDate: "2025-01-15",
        comment: "Living here now. Spotless, hyper-efficient, a little sterile — but the food courts redeem everything.",
        tripType: "solo",
        budgetLevel: "luxury",
        wouldReturn: true,
        districts: [
          { name: "Tiong Bahru", lat: 1.2847, lng: 103.8318, rating: 93, frequency: DistrictFrequency.BASED_HERE },
          { name: "Chinatown", lat: 1.2812, lng: 103.8447, rating: 84, frequency: DistrictFrequency.A_LOT },
        ],
      },
      {
        city: C.seoul,
        rating: 89,
        startDate: "2023-09-05",
        comment: "Coffee capital of Asia, hands down. Nightlife runs till sunrise.",
        tripType: "friends",
        budgetLevel: "mid",
        wouldReturn: true,
      },
      {
        city: C.taipei,
        rating: 86,
        startDate: "2023-11-12",
        comment: "Criminally underrated. Friendliest people in Asia, best night markets.",
        tripType: "solo",
        wouldReturn: true,
      },
      {
        city: C.hongkong,
        rating: 83,
        startDate: "2024-02-01",
        comment: "That skyline from the Peak never gets old. Feels denser every year.",
        tripType: "solo",
      },
      {
        city: C.bangkok,
        rating: 78,
        startDate: "2024-07-20",
        comment: "Chaotic in the best way. Too hot for me long-term though.",
        tripType: "solo",
      },
    ],
    venues: [
      { name: "% Arabica Roastery", type: VenueType.CAFE, rating: 94, location: "Tokyo, Japan", priceLevel: "mid", note: "Best single-origin pour-over I've had. Worth the queue.", wouldReturn: true },
      { name: "Tiong Bahru Bakery", type: VenueType.BAKERY, rating: 88, location: "Singapore", priceLevel: "mid", note: "Kouign-amann that ruins all others for you.", wouldReturn: true },
      { name: "Anthracite Coffee", type: VenueType.CAFE, rating: 90, location: "Seoul, South Korea", priceLevel: "mid", note: "Old shoe factory turned roastery. Pure vibes.", wouldReturn: true },
      { name: "28 HongKong Street", type: VenueType.BAR, rating: 87, location: "Singapore", priceLevel: "high", note: "Speakeasy, no sign. Best cocktails in town.", wouldReturn: true },
      { name: "Raohe Night Market", type: VenueType.RESTAURANT, rating: 85, location: "Taipei, Taiwan", priceLevel: "budget", note: "Pepper buns + stinky tofu. Come hungry.", wouldReturn: true },
      { name: "Fuglen Tokyo", type: VenueType.CAFE, rating: 91, location: "Tokyo, Japan", priceLevel: "mid", note: "Norwegian coffee + vintage furniture in Shibuya. Cocktails at night.", wouldReturn: true },
      { name: "Maison Kayser", type: VenueType.BAKERY, rating: 80, location: "Tokyo, Japan", priceLevel: "mid", note: "Reliable croissant fix between meetings.", wouldReturn: false },
      { name: "Hawker Chan", type: VenueType.RESTAURANT, rating: 82, location: "Singapore", priceLevel: "budget", note: "Michelin soy-sauce chicken rice for 4 SGD. The queue moves fast.", wouldReturn: true },
      { name: "Employees Only", type: VenueType.BAR, rating: 84, location: "Singapore", priceLevel: "high", note: "Manhattans done right. Gets loud after midnight.", wouldReturn: true },
      { name: "Onibus Coffee", type: VenueType.CAFE, rating: 89, location: "Tokyo, Japan", priceLevel: "mid", note: "Tiny Nakameguro spot, train rumbling past the window. Perfect flat white.", wouldReturn: true },
      { name: "Tim Ho Wan", type: VenueType.RESTAURANT, rating: 81, location: "Hong Kong, China (SAR)", priceLevel: "budget", note: "BBQ pork buns that earned a star. Touristy now but still good.", wouldReturn: true },
      { name: "Zoku Rooftop", type: VenueType.BAR, rating: 86, location: "Seoul, South Korea", priceLevel: "high", note: "Skyline cocktails. Sunset slot books out — go early.", wouldReturn: true },
    ],
  },

  // ───────────────────────────────────────────────────────── Leon ──────────
  {
    username: "leon",
    name: "Leon Brandt",
    email: "leon.brandt@example.com",
    bio: "Backpacker 🎒 Mountains > museums. Cheap flights & long buses. 43 countries and counting.",
    visits: [
      {
        city: C.tbilisi,
        rating: 90,
        startDate: "2024-06-01",
        endDate: "2024-08-15",
        comment: "Europe's best-kept secret. Wine, mountains, 1€ khinkali, and a 1-year free visa. Why leave?",
        tripType: "solo",
        budgetLevel: "budget",
        wouldReturn: true,
      },
      {
        city: C.chiangmai,
        rating: 88,
        startDate: "2024-01-10",
        endDate: "2024-03-01",
        comment: "Nomad central for a reason. 400€/month, jungle on your doorstep.",
        tripType: "solo",
        budgetLevel: "budget",
        wouldReturn: true,
      },
      {
        city: C.hanoi,
        rating: 82,
        startDate: "2023-12-05",
        comment: "Sensory overload — in a good way. Egg coffee is a religion here.",
        tripType: "solo",
        budgetLevel: "budget",
      },
      {
        city: C.krakow,
        rating: 80,
        startDate: "2023-08-20",
        comment: "Gorgeous old town, dirt cheap beer. Auschwitz day trip hits hard.",
        tripType: "friends",
        budgetLevel: "budget",
      },
      {
        city: C.porto,
        rating: 84,
        startDate: "2024-09-10",
        comment: "Cheaper and friendlier than Lisbon. Port wine cellars + that river view.",
        tripType: "solo",
        budgetLevel: "budget",
        wouldReturn: true,
      },
      {
        city: C.prag,
        rating: 79,
        startDate: "2023-05-15",
        comment: "Fairytale center, but tourist-trapped now. Beer still cheaper than water.",
        tripType: "friends",
      },
    ],
    venues: [
      { name: "Fabrika Hostel Bar", type: VenueType.BAR, rating: 86, location: "Tbilisi, Georgia", priceLevel: "budget", note: "Old Soviet sewing factory. Whole nomad scene drinks here.", wouldReturn: true },
      { name: "Free Bird Café", type: VenueType.CAFE, rating: 82, location: "Chiang Mai, Thailand", priceLevel: "budget", note: "NGO café, great breakfast, all profits to refugees.", wouldReturn: true },
      { name: "Giang Café", type: VenueType.CAFE, rating: 89, location: "Hanoi, Vietnam", priceLevel: "budget", note: "Inventor of egg coffee. Hidden down an alley.", wouldReturn: true },
      { name: "Cervejaria Gazela", type: VenueType.RESTAURANT, rating: 83, location: "Porto, Portugal", priceLevel: "budget", note: "Spicy sausage sandwich Bourdain raved about. Lives up to it.", wouldReturn: true },
      { name: "Shavi Lomi", type: VenueType.RESTAURANT, rating: 88, location: "Tbilisi, Georgia", priceLevel: "budget", note: "Modern Georgian. Order everything, it's all under 5€.", wouldReturn: true },
      { name: "Cafe Stamba", type: VenueType.CAFE, rating: 84, location: "Tbilisi, Georgia", priceLevel: "mid", note: "Splurge-y for here but the wifi and the building are worth it.", wouldReturn: true },
      { name: "SP Chicken", type: VenueType.RESTAURANT, rating: 80, location: "Chiang Mai, Thailand", priceLevel: "budget", note: "Roast chicken + sticky rice off a cart. Best 2€ in the old city.", wouldReturn: true },
      { name: "Zoe in Yellow", type: VenueType.BAR, rating: 76, location: "Chiang Mai, Thailand", priceLevel: "budget", note: "Backpacker dive. Cheap buckets, sticky floors, no regrets.", wouldReturn: false },
      { name: "Bia Hơi Corner", type: VenueType.BAR, rating: 85, location: "Hanoi, Vietnam", priceLevel: "budget", note: "25-cent fresh beer on plastic stools. The whole Hanoi experience.", wouldReturn: true },
      { name: "Bunkier Café", type: VenueType.CAFE, rating: 81, location: "Kraków, Poland", priceLevel: "budget", note: "Huge glass terrace on the old town. Mulled wine in winter.", wouldReturn: true },
      { name: "Hot Spoon", type: VenueType.RESTAURANT, rating: 78, location: "Kraków, Poland", priceLevel: "budget", note: "Milk-bar style pierogi. Communist-era prices, grandma energy.", wouldReturn: true },
      { name: "Majestic Café", type: VenueType.CAFE, rating: 79, location: "Porto, Portugal", priceLevel: "high", note: "Belle-époque stunner. Overpriced coffee but you're paying for the room.", wouldReturn: false },
    ],
  },

  // ───────────────────────────────────────────────────────── Sofia ─────────
  {
    username: "sofia",
    name: "Sofia Rossi",
    email: "sofia.rossi@example.com",
    bio: "Architecture nerd & food obsessive 🍝 Slow travel only. One city, two weeks, all the museums.",
    visits: [
      {
        city: C.barcelona,
        rating: 93,
        startDate: "2024-05-01",
        endDate: "2024-05-21",
        comment: "Gaudí makes the whole city a gallery. Eixample's grid is urban planning poetry.",
        tripType: "couple",
        budgetLevel: "mid",
        wouldReturn: true,
        districts: [
          { name: "Eixample", lat: 41.3915, lng: 2.1649, rating: 95, frequency: DistrictFrequency.BASED_HERE },
          { name: "Gràcia", lat: 41.4036, lng: 2.1561, rating: 91, frequency: DistrictFrequency.A_LOT },
          { name: "El Born", lat: 41.3839, lng: 2.1817, rating: 88, frequency: DistrictFrequency.FEW_TIMES },
        ],
      },
      {
        city: C.copenhagen,
        rating: 90,
        startDate: "2024-08-10",
        comment: "Design heaven. Every chair, bridge and bakery is considered. Painfully expensive.",
        tripType: "couple",
        budgetLevel: "luxury",
        wouldReturn: true,
        districts: [
          { name: "Nørrebro", lat: 55.6963, lng: 12.5536, rating: 92, frequency: DistrictFrequency.A_LOT },
          { name: "Vesterbro", lat: 55.6679, lng: 12.5494, rating: 89, frequency: DistrictFrequency.FEW_TIMES },
        ],
      },
      {
        city: C.wien,
        rating: 87,
        startDate: "2023-10-05",
        comment: "Imperial grandeur done right. Coffeehouse culture is a whole lifestyle.",
        tripType: "couple",
        budgetLevel: "mid",
      },
      {
        city: C.rom,
        rating: 89,
        startDate: "2024-03-15",
        comment: "Layered like nowhere else — you trip over 2000 years of history. The pasta, obviously.",
        tripType: "couple",
        budgetLevel: "mid",
        wouldReturn: true,
      },
      {
        city: C.milan,
        rating: 78,
        startDate: "2023-11-20",
        comment: "Stylish but cold. The Duomo and aperitivo culture save it.",
        tripType: "solo",
      },
      {
        city: C.porto,
        rating: 85,
        startDate: "2024-06-25",
        comment: "Azulejo tiles everywhere. The Lello bookshop is worth the hype.",
        tripType: "couple",
        wouldReturn: true,
      },
    ],
    venues: [
      { name: "Disfrutar", type: VenueType.RESTAURANT, rating: 98, location: "Barcelona, Spain", priceLevel: "luxury", note: "Best meal of my life. Book 3 months ahead. Worth every euro.", wouldReturn: true },
      { name: "Bar del Pla", type: VenueType.RESTAURANT, rating: 89, location: "Barcelona, Spain", priceLevel: "mid", note: "Tapas in El Born. The ham croquetas. That's it, that's the review.", wouldReturn: true },
      { name: "Apollo Bar", type: VenueType.BAR, rating: 86, location: "Copenhagen, Denmark", priceLevel: "high", note: "Natural wine in a courtyard. Effortlessly Danish.", wouldReturn: true },
      { name: "Café Central", type: VenueType.CAFE, rating: 84, location: "Vienna, Austria", priceLevel: "mid", note: "Touristy but the Sachertorte and the vaulted ceilings deliver.", wouldReturn: false },
      { name: "Roscioli", type: VenueType.RESTAURANT, rating: 92, location: "Rome, Italy", priceLevel: "high", note: "Cacio e pepe that recalibrates your standards. Half deli, half temple.", wouldReturn: true },
      { name: "Quimet & Quimet", type: VenueType.BAR, rating: 90, location: "Barcelona, Spain", priceLevel: "mid", note: "Standing-room montaditos bar. Five generations deep. Get the salmon-yoghurt one.", wouldReturn: true },
      { name: "Satan's Coffee Corner", type: VenueType.CAFE, rating: 85, location: "Barcelona, Spain", priceLevel: "mid", note: "Best flat white in the Gothic Quarter. Tiny, always busy.", wouldReturn: true },
      { name: "Hart Bageri", type: VenueType.BAKERY, rating: 93, location: "Copenhagen, Denmark", priceLevel: "high", note: "Cardamom buns by a former Noma baker. Sells out by 11am.", wouldReturn: true },
      { name: "Atelier September", type: VenueType.CAFE, rating: 87, location: "Copenhagen, Denmark", priceLevel: "high", note: "The avocado toast that launched a thousand Instagram posts. Still good.", wouldReturn: true },
      { name: "Plötzlich", type: VenueType.RESTAURANT, rating: 82, location: "Vienna, Austria", priceLevel: "mid", note: "Modern take on Wiener schnitzel. Less heavy than the classics.", wouldReturn: true },
      { name: "Trapizzino", type: VenueType.RESTAURANT, rating: 86, location: "Rome, Italy", priceLevel: "budget", note: "Street-food pizza pockets stuffed with slow-cooked ragù. Genius.", wouldReturn: true },
      { name: "Sant'Eustachio Il Caffè", type: VenueType.CAFE, rating: 88, location: "Rome, Italy", priceLevel: "mid", note: "The espresso the whole city measures itself against. Don't ask for oat milk.", wouldReturn: true },
      { name: "Pasticceria Marchesi", type: VenueType.BAKERY, rating: 83, location: "Milan, Italy", priceLevel: "high", note: "Prada-owned, impossibly elegant. The panettone is the reason to come.", wouldReturn: false },
    ],
  },

  // ──────────────────────────────────────────────────────── Jordan ─────────
  {
    username: "jordan",
    name: "Jordan Mbeki",
    email: "jordan.mbeki@example.com",
    bio: "Solo female travel ✈️ Safety-first city reviews, no sugarcoating. Currently: South America 🌎",
    visits: [
      {
        city: C.mexico,
        rating: 88,
        startDate: "2024-02-10",
        endDate: "2024-03-10",
        comment: "Wildly underestimated. Roma Norte is as safe & walkable as any European capital. World-class food at every price.",
        tripType: "solo",
        budgetLevel: "mid",
        wouldReturn: true,
        districts: [
          { name: "Roma Norte", lat: 19.4185, lng: -99.1605, rating: 94, frequency: DistrictFrequency.BASED_HERE },
          { name: "Condesa", lat: 19.4109, lng: -99.1715, rating: 90, frequency: DistrictFrequency.A_LOT },
          { name: "Centro Histórico", lat: 19.4326, lng: -99.1332, rating: 75, frequency: DistrictFrequency.FEW_TIMES },
        ],
      },
      {
        city: C.medellin,
        rating: 84,
        startDate: "2024-04-05",
        comment: "El Poblado is a bubble — safe, but stick to it after dark. The transformation story is real and inspiring.",
        tripType: "solo",
        budgetLevel: "budget",
        wouldReturn: true,
      },
      {
        city: C.buenosaires,
        rating: 86,
        startDate: "2024-05-20",
        comment: "Europe's soul in South America. Palermo is fantastic. Watch your phone, carry small bills.",
        tripType: "solo",
        budgetLevel: "budget",
        wouldReturn: true,
      },
      {
        city: C.capetown,
        rating: 81,
        startDate: "2023-12-01",
        comment: "Jaw-dropping nature. Real safety homework required — Uber everywhere, don't walk at night.",
        tripType: "friends",
        budgetLevel: "mid",
      },
      {
        city: C.lima,
        rating: 76,
        startDate: "2024-06-15",
        comment: "Miraflores is safe & lovely; rest of the city needs care. The ceviche is reason enough to come.",
        tripType: "solo",
      },
    ],
    venues: [
      { name: "Contramar", type: VenueType.RESTAURANT, rating: 91, location: "Mexico City, Mexico", priceLevel: "mid", note: "Tuna tostadas. Long lunch, lots of wine, the whole Roma Norte set is here.", wouldReturn: true },
      { name: "Pergamino Café", type: VenueType.CAFE, rating: 87, location: "Medellín, Colombia", priceLevel: "mid", note: "Colombian coffee done seriously. Safe wifi spot in El Poblado.", wouldReturn: true },
      { name: "Florería Atlántico", type: VenueType.BAR, rating: 89, location: "Buenos Aires, Argentina", priceLevel: "high", note: "Speakeasy behind a flower shop. World's-50-best for a reason.", wouldReturn: true },
      { name: "Central", type: VenueType.RESTAURANT, rating: 95, location: "Lima, Peru", priceLevel: "luxury", note: "Tasting menu by altitude. A bucket-list meal. Book months ahead.", wouldReturn: true },
      { name: "Panadería Rosetta", type: VenueType.BAKERY, rating: 90, location: "Mexico City, Mexico", priceLevel: "mid", note: "Guava roll is a religious experience. Well-lit, safe corner of Roma Norte.", wouldReturn: true },
      { name: "Café Nin", type: VenueType.CAFE, rating: 85, location: "Mexico City, Mexico", priceLevel: "mid", note: "Great solo-brunch spot — communal table, easy to feel comfortable alone.", wouldReturn: true },
      { name: "Licorería Limantour", type: VenueType.BAR, rating: 88, location: "Mexico City, Mexico", priceLevel: "high", note: "World-class cocktails, felt totally safe leaving solo at midnight. Take an Uber.", wouldReturn: true },
      { name: "Café Zorba", type: VenueType.RESTAURANT, rating: 79, location: "Medellín, Colombia", priceLevel: "budget", note: "Veggie pizza in a leafy Poblado courtyard. Solo-friendly, slow wifi.", wouldReturn: true },
      { name: "Don Julio", type: VenueType.RESTAURANT, rating: 93, location: "Buenos Aires, Argentina", priceLevel: "high", note: "The steak that justifies the flight. They'll seat a solo diner warmly.", wouldReturn: true },
      { name: "Café San Juan", type: VenueType.RESTAURANT, rating: 84, location: "Buenos Aires, Argentina", priceLevel: "mid", note: "Bustling bodegón in San Telmo. Go at lunch, it's safer and livelier.", wouldReturn: true },
      { name: "Truffle Café", type: VenueType.CAFE, rating: 80, location: "Cape Town, South Africa", priceLevel: "mid", note: "Reliable, safe daytime work café near the waterfront. Don't linger after dark.", wouldReturn: false },
    ],
  },

  // ───────────────────────────────────────────────────────── Tom ───────────
  {
    username: "tomf",
    name: "Tom Fischer",
    email: "tom.fischer@example.com",
    bio: "Weekend city breaks from Berlin 🚆 Beer gardens, record stores & techno. Cheap flights only.",
    visits: [
      {
        city: C.berlin,
        rating: 94,
        startDate: "2019-01-01",
        endDate: "2025-06-01",
        comment: "Home. Nowhere else lets you be this free. Berghain on Saturday, lake on Sunday.",
        tripType: "solo",
        budgetLevel: "mid",
        wouldReturn: true,
        districts: [
          { name: "Kreuzberg", lat: 52.4986, lng: 13.4039, rating: 95, frequency: DistrictFrequency.BASED_HERE },
          { name: "Friedrichshain", lat: 52.5155, lng: 13.4543, rating: 90, frequency: DistrictFrequency.A_LOT },
          { name: "Neukölln", lat: 52.4811, lng: 13.4353, rating: 88, frequency: DistrictFrequency.A_LOT },
          { name: "Mitte", lat: 52.5219, lng: 13.4132, rating: 72, frequency: DistrictFrequency.FEW_TIMES },
        ],
      },
      {
        city: C.amsterdam,
        rating: 83,
        startDate: "2024-03-08",
        comment: "Perfect weekender. Bikes, canals, brown cafés. Gets a bit theme-park in the center.",
        tripType: "friends",
        budgetLevel: "mid",
      },
      {
        city: C.copenhagen,
        rating: 85,
        startDate: "2024-09-13",
        comment: "Cleanest techno scene in Europe and you can drink a beer by the harbour after. Pricey though.",
        tripType: "friends",
        budgetLevel: "high",
        wouldReturn: true,
      },
      {
        city: C.warsaw,
        rating: 80,
        startDate: "2024-11-22",
        comment: "Hugely slept-on nightlife. Cheap, gritty, friendly. Praga district is the move.",
        tripType: "friends",
        budgetLevel: "budget",
        wouldReturn: true,
      },
      {
        city: C.prag,
        rating: 81,
        startDate: "2023-10-06",
        comment: "Classic weekender. Beautiful but you're never alone in it. Beer spa was worth it.",
        tripType: "friends",
      },
      {
        city: C.hamburg,
        rating: 86,
        startDate: "2024-05-17",
        comment: "Reeperbahn is dirty fun, but the harbour and the Elbphilharmonie are the real draw.",
        tripType: "friends",
        wouldReturn: true,
      },
    ],
    venues: [
      { name: "Zur Wilden Renate", type: VenueType.CLUB, rating: 92, location: "Berlin, Germany", priceLevel: "mid", note: "Maze of a club in an old apartment block. Best garden in the city.", wouldReturn: true },
      { name: "Café Kotti", type: VenueType.CAFE, rating: 79, location: "Berlin, Germany", priceLevel: "budget", note: "Kreuzberg institution. Cheap, smoky, perfect for a hungover Sunday.", wouldReturn: true },
      { name: "Wenigemarkt", type: VenueType.BAR, rating: 78, location: "Warsaw, Poland", priceLevel: "budget", note: "Vodka flights for the price of a Berlin beer. Dangerous.", wouldReturn: true },
      { name: "Café Brecht", type: VenueType.BAR, rating: 81, location: "Amsterdam, Netherlands", priceLevel: "mid", note: "Cozy living-room bar. Genever and good chats.", wouldReturn: true },
      { name: "Berghain", type: VenueType.CLUB, rating: 95, location: "Berlin, Germany", priceLevel: "mid", note: "The cathedral. Sound system is unmatched. Just don't talk about getting in.", wouldReturn: true },
      { name: "Klunkerkranich", type: VenueType.BAR, rating: 87, location: "Berlin, Germany", priceLevel: "budget", note: "Rooftop bar on a parking garage in Neukölln. Sunset beers, whole city below.", wouldReturn: true },
      { name: "Prater Garten", type: VenueType.BAR, rating: 84, location: "Berlin, Germany", priceLevel: "budget", note: "Berlin's oldest beer garden. Chestnut trees, half-litres, zero pretension.", wouldReturn: true },
      { name: "Sisyphos", type: VenueType.CLUB, rating: 90, location: "Berlin, Germany", priceLevel: "mid", note: "Festival-in-a-junkyard energy, runs all weekend. Bring sunscreen.", wouldReturn: true },
      { name: "Burgermeister", type: VenueType.RESTAURANT, rating: 82, location: "Berlin, Germany", priceLevel: "budget", note: "Burgers from a converted public toilet under the U-Bahn. 4am savior.", wouldReturn: true },
      { name: "Smolna", type: VenueType.CLUB, rating: 83, location: "Warsaw, Poland", priceLevel: "budget", note: "Warsaw's techno answer to Berlin. Cheaper, friendlier door.", wouldReturn: true },
      { name: "Culture Club", type: VenueType.CLUB, rating: 80, location: "Copenhagen, Denmark", priceLevel: "high", note: "Clean Scandi techno. Pricey drinks but the sound is crisp.", wouldReturn: false },
      { name: "Mikkeller Bar", type: VenueType.BAR, rating: 88, location: "Copenhagen, Denmark", priceLevel: "high", note: "20 taps of Danish craft. Worth blowing the budget for a couple.", wouldReturn: true },
    ],
  },
];

// ── seeding ──────────────────────────────────────────────────────────────
async function main() {
  const usernames = personas.map((p) => p.username);

  // Wipe ONLY the test users (cascade removes their visits, visit_districts,
  // venues, settings). Your own account and shared cities/districts survive.
  const deleted = await prisma.user.deleteMany({
    where: { username: { in: usernames } },
  });
  if (deleted.count) console.log(`Removed ${deleted.count} existing test user(s)`);

  for (const p of personas) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        username: p.username,
        bio: p.bio,
        publicProfile: true,
        settings: {
          create: {
            theme: "dark",
            dateFormat: "DD.MM.YYYY",
            defaultSortBy: "rating",
            defaultSortOrder: "desc",
            homeCurrency: "EUR",
            distanceUnit: "km",
          },
        },
      },
    });

    let visitCount = 0;
    let districtCount = 0;

    for (const v of p.visits) {
      const city = await getOrCreateCity(v.city);

      const visit = await prisma.visit.create({
        data: {
          userId: user.id,
          cityId: city.id,
          rating: v.rating,
          comment: v.comment,
          startDate: d(v.startDate),
          endDate: v.endDate ? d(v.endDate) : null,
          tripType: v.tripType,
          budgetLevel: v.budgetLevel,
          wouldReturn: v.wouldReturn,
          highlights: v.highlights,
          transport: v.transport,
          visibility: "PUBLIC",
        },
      });
      visitCount++;

      if (v.districts?.length) {
        for (const dist of v.districts) {
          const district = await getOrCreateDistrict(city.id, dist.name, dist.lat, dist.lng);
          await prisma.visitDistrict.create({
            data: {
              visitId: visit.id,
              districtId: district.id,
              rating: dist.rating,
              frequency: dist.frequency,
            },
          });
          districtCount++;
        }
      }
    }

    for (const ven of p.venues) {
      await prisma.venue.create({
        data: {
          userId: user.id,
          name: ven.name,
          type: ven.type,
          rating: ven.rating,
          location: ven.location,
          priceLevel: ven.priceLevel,
          note: ven.note,
          wouldReturn: ven.wouldReturn,
        },
      });
    }

    console.log(
      `@${p.username.padEnd(8)} → ${visitCount} visits, ${districtCount} districts, ${p.venues.length} places`
    );
  }

  console.log("\n✅ Done. Public profiles:");
  for (const p of personas) console.log(`   /@${p.username}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
