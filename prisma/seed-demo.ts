import { PrismaClient } from "@prisma/client";

// Demo content for the friends-beta: a handful of believable public travellers
// so the feed, search, city pages and globe aren't an empty cold-start. Every
// account is CLEARLY marked as demo (name "(Demo)", handle "_demo", bio tag) and
// is fully removable in one command:
//
//   DELETE FROM users WHERE email LIKE 'demo+%@ranking.place';  -- cascades
//
// Run (prod):  DATABASE_URL=<prod url> npx tsx prisma/seed-demo.ts
// Re-runnable: it deletes existing demo users first, then recreates them.

const prisma = new PrismaClient();

// name -> real-ish coordinates + city-proper population (drives million-cities
// stat + badges). Approximate but realistic.
const CITIES: Record<
  string,
  { country: string; lat: number; lng: number; pop: number }
> = {
  Tokyo: { country: "Japan", lat: 35.68, lng: 139.69, pop: 13960000 },
  Osaka: { country: "Japan", lat: 34.69, lng: 135.5, pop: 2750000 },
  Seoul: { country: "South Korea", lat: 37.57, lng: 126.98, pop: 9730000 },
  Shanghai: { country: "China", lat: 31.23, lng: 121.47, pop: 24870000 },
  Beijing: { country: "China", lat: 39.9, lng: 116.4, pop: 21540000 },
  Bangkok: { country: "Thailand", lat: 13.76, lng: 100.5, pop: 8280000 },
  Singapore: { country: "Singapore", lat: 1.35, lng: 103.82, pop: 5450000 },
  "Hong Kong": { country: "Hong Kong", lat: 22.32, lng: 114.17, pop: 7480000 },
  Taipei: { country: "Taiwan", lat: 25.03, lng: 121.57, pop: 2600000 },
  Jakarta: { country: "Indonesia", lat: -6.21, lng: 106.85, pop: 10560000 },
  Manila: { country: "Philippines", lat: 14.6, lng: 120.98, pop: 1780000 },
  "Kuala Lumpur": { country: "Malaysia", lat: 3.14, lng: 101.69, pop: 1980000 },
  "Ho Chi Minh City": { country: "Vietnam", lat: 10.82, lng: 106.63, pop: 8990000 },
  Hanoi: { country: "Vietnam", lat: 21.03, lng: 105.85, pop: 8050000 },
  Stockholm: { country: "Sweden", lat: 59.33, lng: 18.06, pop: 975000 },
  Copenhagen: { country: "Denmark", lat: 55.68, lng: 12.57, pop: 660000 },
  Oslo: { country: "Norway", lat: 59.91, lng: 10.75, pop: 700000 },
  Helsinki: { country: "Finland", lat: 60.17, lng: 24.94, pop: 660000 },
  Reykjavik: { country: "Iceland", lat: 64.15, lng: -21.94, pop: 135000 },
  Tallinn: { country: "Estonia", lat: 59.44, lng: 24.75, pop: 445000 },
  Amsterdam: { country: "Netherlands", lat: 52.37, lng: 4.9, pop: 905000 },
  Bergen: { country: "Norway", lat: 60.39, lng: 5.32, pop: 285000 },
  Gothenburg: { country: "Sweden", lat: 57.71, lng: 11.97, pop: 580000 },
  Edinburgh: { country: "United Kingdom", lat: 55.95, lng: -3.19, pop: 525000 },
  Vienna: { country: "Austria", lat: 48.21, lng: 16.37, pop: 1920000 },
  Prague: { country: "Czechia", lat: 50.08, lng: 14.44, pop: 1360000 },
  Rome: { country: "Italy", lat: 41.9, lng: 12.5, pop: 2760000 },
  Naples: { country: "Italy", lat: 40.85, lng: 14.27, pop: 910000 },
  Florence: { country: "Italy", lat: 43.77, lng: 11.26, pop: 380000 },
  Bologna: { country: "Italy", lat: 44.49, lng: 11.34, pop: 390000 },
  Barcelona: { country: "Spain", lat: 41.39, lng: 2.17, pop: 1640000 },
  Madrid: { country: "Spain", lat: 40.42, lng: -3.7, pop: 3330000 },
  Lisbon: { country: "Portugal", lat: 38.72, lng: -9.14, pop: 545000 },
  Porto: { country: "Portugal", lat: 41.16, lng: -8.62, pop: 230000 },
  "San Sebastian": { country: "Spain", lat: 43.32, lng: -1.98, pop: 188000 },
  Marseille: { country: "France", lat: 43.3, lng: 5.37, pop: 870000 },
  Lyon: { country: "France", lat: 45.76, lng: 4.84, pop: 520000 },
  Palermo: { country: "Italy", lat: 38.12, lng: 13.36, pop: 640000 },
  Valencia: { country: "Spain", lat: 39.47, lng: -0.38, pop: 790000 },
  Athens: { country: "Greece", lat: 37.98, lng: 23.73, pop: 660000 },
  Kathmandu: { country: "Nepal", lat: 27.7, lng: 85.32, pop: 975000 },
  Delhi: { country: "India", lat: 28.61, lng: 77.21, pop: 16790000 },
  Cairo: { country: "Egypt", lat: 30.04, lng: 31.24, pop: 9540000 },
  Marrakech: { country: "Morocco", lat: 31.63, lng: -7.99, pop: 930000 },
  "Cape Town": { country: "South Africa", lat: -33.92, lng: 18.42, pop: 4620000 },
  Nairobi: { country: "Kenya", lat: -1.29, lng: 36.82, pop: 4400000 },
  "Mexico City": { country: "Mexico", lat: 19.43, lng: -99.13, pop: 9210000 },
  Lima: { country: "Peru", lat: -12.05, lng: -77.04, pop: 8850000 },
  Cusco: { country: "Peru", lat: -13.53, lng: -71.97, pop: 430000 },
  "La Paz": { country: "Bolivia", lat: -16.5, lng: -68.15, pop: 760000 },
  "Buenos Aires": { country: "Argentina", lat: -34.6, lng: -58.38, pop: 3070000 },
  Tbilisi: { country: "Georgia", lat: 41.72, lng: 44.79, pop: 1120000 },
  Istanbul: { country: "Turkey", lat: 41.01, lng: 28.98, pop: 15460000 },
  "New York": { country: "United States", lat: 40.71, lng: -74.01, pop: 8380000 },
  Chicago: { country: "United States", lat: 41.88, lng: -87.63, pop: 2700000 },
  Berlin: { country: "Germany", lat: 52.52, lng: 13.4, pop: 3770000 },
  Rotterdam: { country: "Netherlands", lat: 51.92, lng: 4.48, pop: 650000 },
  Paris: { country: "France", lat: 48.86, lng: 2.35, pop: 2160000 },
  London: { country: "United Kingdom", lat: 51.51, lng: -0.13, pop: 8900000 },
  "Brasilia": { country: "Brazil", lat: -15.79, lng: -47.88, pop: 3050000 },
  Dubai: { country: "United Arab Emirates", lat: 25.2, lng: 55.27, pop: 3330000 },
  "Medellin": { country: "Colombia", lat: 6.24, lng: -75.58, pop: 2530000 },
  Denpasar: { country: "Indonesia", lat: -8.65, lng: 115.22, pop: 900000 },
  Bansko: { country: "Bulgaria", lat: 41.84, lng: 23.49, pop: 8000 },
  "Chiang Mai": { country: "Thailand", lat: 18.79, lng: 98.99, pop: 130000 },
  "Las Palmas": { country: "Spain", lat: 28.12, lng: -15.43, pop: 380000 },
  "Santa Cruz de Tenerife": { country: "Spain", lat: 28.47, lng: -16.25, pop: 210000 },
};

interface DemoVisit {
  city: keyof typeof CITIES;
  rating: number;
  comment?: string;
}

interface Persona {
  username: string;
  name: string;
  bio: string;
  visits: DemoVisit[];
}

const TAG = "✦ Demo account — sample data so you can explore ranking.place.";

const PERSONAS: Persona[] = [
  {
    username: "mara_demo",
    name: "Mara Lindqvist (Demo)",
    bio: `${TAG} Slow travel, good coffee, northern light.`,
    visits: [
      { city: "Stockholm", rating: 88, comment: "Home base energy. The archipelago in summer is unreal." },
      { city: "Copenhagen", rating: 91, comment: "Bikes, bakeries, and that easy Nordic calm. Could live here." },
      { city: "Oslo", rating: 79 },
      { city: "Helsinki", rating: 82, comment: "Underrated. Saunas and silence." },
      { city: "Reykjavik", rating: 86 },
      { city: "Tallinn", rating: 84, comment: "Medieval old town, modern café scene." },
      { city: "Amsterdam", rating: 80 },
      { city: "Bergen", rating: 77 },
      { city: "Gothenburg", rating: 74 },
      { city: "Edinburgh", rating: 85, comment: "Grey skies, golden hour, great whisky." },
      { city: "Vienna", rating: 83 },
      { city: "Prague", rating: 81 },
    ],
  },
  {
    username: "kenji_demo",
    name: "Kenji Watanabe (Demo)",
    bio: `${TAG} Megacity collector — if it's over a million, I've slept there.`,
    visits: [
      { city: "Tokyo", rating: 96, comment: "The greatest city on earth. I will not be taking questions." },
      { city: "Osaka", rating: 90, comment: "Tokyo's louder, hungrier cousin." },
      { city: "Seoul", rating: 89 },
      { city: "Shanghai", rating: 84 },
      { city: "Beijing", rating: 76 },
      { city: "Bangkok", rating: 87, comment: "Chaos in the best way. Street food champion." },
      { city: "Singapore", rating: 82 },
      { city: "Hong Kong", rating: 88, comment: "Skyline + dim sum + hiking trails 20 min apart." },
      { city: "Taipei", rating: 85 },
      { city: "Jakarta", rating: 68 },
      { city: "Kuala Lumpur", rating: 78 },
      { city: "Ho Chi Minh City", rating: 80 },
      { city: "Hanoi", rating: 83 },
    ],
  },
  {
    username: "sofia_demo",
    name: "Sofia Marchetti (Demo)",
    bio: `${TAG} Food first, always. Rating cities by their markets.`,
    visits: [
      { city: "Rome", rating: 92, comment: "Cacio e pepe at midnight. Need I say more." },
      { city: "Naples", rating: 95, comment: "The pizza capital. Everywhere else is practising." },
      { city: "Florence", rating: 87 },
      { city: "Bologna", rating: 90, comment: "Literally nicknamed 'the fat one'. My people." },
      { city: "Barcelona", rating: 86 },
      { city: "Madrid", rating: 81 },
      { city: "Lisbon", rating: 88, comment: "Pastéis de nata for breakfast, no regrets." },
      { city: "San Sebastian", rating: 94, comment: "Pintxos crawl heaven. Best eating on the planet." },
      { city: "Marseille", rating: 79 },
      { city: "Lyon", rating: 89, comment: "France's actual food capital, fight me." },
      { city: "Palermo", rating: 83 },
      { city: "Valencia", rating: 80 },
      { city: "Athens", rating: 77 },
    ],
  },
  {
    username: "theo_demo",
    name: "Theo Bennett (Demo)",
    bio: `${TAG} Backpacker, 40+ countries, one carry-on.`,
    visits: [
      { city: "Bangkok", rating: 84 },
      { city: "Hanoi", rating: 86, comment: "Motorbike chaos, incredible pho, gets under your skin." },
      { city: "Kathmandu", rating: 72 },
      { city: "Delhi", rating: 65, comment: "Intense. Loved it and needed a break from it." },
      { city: "Cairo", rating: 70 },
      { city: "Marrakech", rating: 81 },
      { city: "Cape Town", rating: 93, comment: "Table Mountain at sunrise. Top 3 city on earth." },
      { city: "Nairobi", rating: 68 },
      { city: "Mexico City", rating: 90, comment: "Massively underrated. Tacos, museums, parks, all of it." },
      { city: "Lima", rating: 79 },
      { city: "Cusco", rating: 88 },
      { city: "La Paz", rating: 74 },
      { city: "Buenos Aires", rating: 87 },
      { city: "Tbilisi", rating: 85, comment: "Cheap, beautiful, ridiculous wine. Go now." },
      { city: "Istanbul", rating: 91 },
    ],
  },
  {
    username: "amara_demo",
    name: "Amara Okafor (Demo)",
    bio: `${TAG} Architecture & design — cities as built things.`,
    visits: [
      { city: "New York", rating: 90, comment: "The grid, the towers, the energy. A masterpiece of ambition." },
      { city: "Chicago", rating: 88, comment: "The real architecture capital of the US." },
      { city: "Berlin", rating: 85 },
      { city: "Rotterdam", rating: 83, comment: "A whole city as a design experiment." },
      { city: "Copenhagen", rating: 89 },
      { city: "Tokyo", rating: 92 },
      { city: "Paris", rating: 84 },
      { city: "London", rating: 82 },
      { city: "Mexico City", rating: 86 },
      { city: "Brasilia", rating: 70, comment: "Niemeyer's dream. Stunning to look at, strange to live in." },
      { city: "Singapore", rating: 87 },
      { city: "Dubai", rating: 66 },
    ],
  },
  {
    username: "lucas_demo",
    name: "Lucas Reyes (Demo)",
    bio: `${TAG} Remote-work nomad, chasing fast wifi + warm winters.`,
    visits: [
      { city: "Lisbon", rating: 89, comment: "The nomad capital for a reason. Sun, surf, startups." },
      { city: "Mexico City", rating: 91 },
      { city: "Denpasar", rating: 82, comment: "Bali base. Great for a month, then island fever sets in." },
      { city: "Bangkok", rating: 85 },
      { city: "Medellin", rating: 88, comment: "Eternal spring, fast fibre, friendly people." },
      { city: "Tbilisi", rating: 84 },
      { city: "Tallinn", rating: 80, comment: "E-residency nerd heaven." },
      { city: "Bansko", rating: 76, comment: "Surprise nomad hub. Ski in the morning, code in the afternoon." },
      { city: "Chiang Mai", rating: 87 },
      { city: "Las Palmas", rating: 83 },
      { city: "Santa Cruz de Tenerife", rating: 79 },
      { city: "Buenos Aires", rating: 86 },
    ],
  },
];

// Who follows whom (by username). A loose web so social counts + the "following"
// feed look alive.
const FOLLOWS: [string, string][] = [
  ["mara_demo", "sofia_demo"],
  ["mara_demo", "amara_demo"],
  ["mara_demo", "lucas_demo"],
  ["kenji_demo", "theo_demo"],
  ["kenji_demo", "amara_demo"],
  ["sofia_demo", "mara_demo"],
  ["sofia_demo", "theo_demo"],
  ["theo_demo", "lucas_demo"],
  ["theo_demo", "kenji_demo"],
  ["theo_demo", "sofia_demo"],
  ["amara_demo", "kenji_demo"],
  ["amara_demo", "mara_demo"],
  ["lucas_demo", "theo_demo"],
  ["lucas_demo", "sofia_demo"],
  ["lucas_demo", "mara_demo"],
];

// A pool of comment bodies dropped onto random visits by a different persona.
const COMMENT_TEXTS = [
  "Totally agree with this rating.",
  "Adding this to my list immediately.",
  "Ok you've convinced me, booking flights.",
  "Hard disagree but I respect it 😄",
  "This is exactly how I felt too.",
  "Best city I never expected to love.",
  "The food alone is worth the trip.",
  "Underrated take, glad someone said it.",
  "Going back next year, can't wait.",
  "How was it for working remotely?",
];

const rnd = (n: number) => Math.floor(Math.random() * n);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

async function main() {
  // Idempotent: wipe any prior demo users (cascades to their visits / follows /
  // likes / comments), then rebuild from scratch.
  const deleted = await prisma.user.deleteMany({
    where: { email: { startsWith: "demo+" } },
  });
  console.log(`Removed ${deleted.count} existing demo user(s).`);

  // Create-or-find every city used, with population.
  const cityIds = new Map<string, string>();
  for (const [name, c] of Object.entries(CITIES)) {
    const existing = await prisma.city.findFirst({
      where: { name, country: c.country },
    });
    const row =
      existing ??
      (await prisma.city.create({
        data: {
          name,
          country: c.country,
          latitude: c.lat,
          longitude: c.lng,
          population: c.pop,
        },
      }));
    // Backfill population if the city pre-existed without one.
    if (existing && existing.population == null) {
      await prisma.city.update({ where: { id: existing.id }, data: { population: c.pop } });
    }
    cityIds.set(name, row.id);
  }
  console.log(`Ensured ${cityIds.size} cities.`);

  // Create users + their visits. Track each user's visit ids for likes/comments.
  const userIds = new Map<string, string>();
  const allVisitIds: { id: string; userId: string }[] = [];

  for (const p of PERSONAS) {
    const user = await prisma.user.create({
      data: {
        email: `demo+${p.username.replace("_demo", "")}@ranking.place`,
        username: p.username,
        name: p.name,
        bio: p.bio,
        publicProfile: true,
        // No authId → display-only account, can't be logged into.
      },
    });
    userIds.set(p.username, user.id);

    let i = 0;
    for (const v of p.visits) {
      const cityId = cityIds.get(v.city as string)!;
      // startDate spread across the last ~4 years; createdAt across the last
      // ~25 days so the global feed looks freshly active.
      const start = daysAgo(60 + rnd(1400));
      const created = daysAgo(rnd(25) + Math.random());
      const visit = await prisma.visit.create({
        data: {
          userId: user.id,
          cityId,
          rating: v.rating,
          comment: v.comment ?? null,
          startDate: start,
          createdAt: created,
          visibility: "PUBLIC",
        },
      });
      allVisitIds.push({ id: visit.id, userId: user.id });
      i++;
    }
    console.log(`  ${p.username}: ${i} visits.`);
  }

  // Follows.
  let follows = 0;
  for (const [a, b] of FOLLOWS) {
    const followerId = userIds.get(a);
    const followingId = userIds.get(b);
    if (!followerId || !followingId) continue;
    await prisma.follow.create({ data: { followerId, followingId } });
    follows++;
  }
  console.log(`Created ${follows} follows.`);

  // Likes: each user likes a random handful of OTHER users' visits.
  const userList = [...userIds.values()];
  let likes = 0;
  for (const uid of userList) {
    const others = allVisitIds.filter((v) => v.userId !== uid);
    const picks = new Set<string>();
    while (picks.size < Math.min(8, others.length)) {
      picks.add(others[rnd(others.length)].id);
    }
    for (const visitId of picks) {
      try {
        await prisma.visitLike.create({ data: { userId: uid, visitId } });
        likes++;
      } catch {
        /* unique clash — skip */
      }
    }
  }
  console.log(`Created ${likes} likes.`);

  // Comments: drop a few onto random visits, authored by a different user.
  let comments = 0;
  for (let k = 0; k < 18; k++) {
    const target = allVisitIds[rnd(allVisitIds.length)];
    const author = userList[rnd(userList.length)];
    if (author === target.userId) continue;
    await prisma.visitComment.create({
      data: {
        visitId: target.id,
        userId: author,
        body: COMMENT_TEXTS[rnd(COMMENT_TEXTS.length)],
        createdAt: daysAgo(rnd(20) + Math.random()),
      },
    });
    comments++;
  }
  console.log(`Created ${comments} comments.`);

  console.log("\nDemo data seeded. Remove anytime with:");
  console.log(`  DELETE FROM users WHERE email LIKE 'demo+%@ranking.place';`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
