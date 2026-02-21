import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data for fresh seed
  await prisma.userSettings.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  // Create user — seasoned traveler persona
  const user = await prisma.user.create({
    data: {
      id: "default-user",
      name: "Elena Vasquez",
      email: "elena.vasquez@wanderlust.io",
    },
  });

  console.log("Created user:", user.name);

  // Custom settings — she prefers light theme, ISO dates, EUR
  await prisma.userSettings.create({
    data: {
      userId: user.id,
      theme: "dark",
      dateFormat: "YYYY-MM-DD",
      defaultSortBy: "rating",
      defaultSortOrder: "desc",
      homeCurrency: "EUR",
      distanceUnit: "km",
      defaultTripType: "solo",
      defaultBudget: "moderate",
    },
  });

  console.log("Created user settings");

  // ── Cities ────────────────────────────────────────────────
  const cities = await Promise.all([
    // 0 — Tokyo
    prisma.city.create({
      data: {
        name: "Tokyo",
        country: "Japan",
        latitude: 35.6762,
        longitude: 139.6503,
        population: 13960000,
        timezone: "Asia/Tokyo",
      },
    }),
    // 1 — Paris
    prisma.city.create({
      data: {
        name: "Paris",
        country: "France",
        latitude: 48.8566,
        longitude: 2.3522,
        population: 2161000,
        timezone: "Europe/Paris",
      },
    }),
    // 2 — New York
    prisma.city.create({
      data: {
        name: "New York",
        country: "United States",
        state: "New York",
        latitude: 40.7128,
        longitude: -74.006,
        population: 8336000,
        timezone: "America/New_York",
      },
    }),
    // 3 — Sydney
    prisma.city.create({
      data: {
        name: "Sydney",
        country: "Australia",
        state: "New South Wales",
        latitude: -33.8688,
        longitude: 151.2093,
        population: 5312000,
        timezone: "Australia/Sydney",
      },
    }),
    // 4 — Cape Town
    prisma.city.create({
      data: {
        name: "Cape Town",
        country: "South Africa",
        state: "Western Cape",
        latitude: -33.9249,
        longitude: 18.4241,
        population: 4618000,
        timezone: "Africa/Johannesburg",
      },
    }),
    // 5 — Barcelona
    prisma.city.create({
      data: {
        name: "Barcelona",
        country: "Spain",
        state: "Catalonia",
        latitude: 41.3874,
        longitude: 2.1686,
        population: 1621000,
        timezone: "Europe/Madrid",
      },
    }),
    // 6 — Bangkok
    prisma.city.create({
      data: {
        name: "Bangkok",
        country: "Thailand",
        latitude: 13.7563,
        longitude: 100.5018,
        population: 10539000,
        timezone: "Asia/Bangkok",
      },
    }),
    // 7 — Reykjavik
    prisma.city.create({
      data: {
        name: "Reykjavik",
        country: "Iceland",
        latitude: 64.1466,
        longitude: -21.9426,
        population: 131000,
        timezone: "Atlantic/Reykjavik",
      },
    }),
    // 8 — Marrakech
    prisma.city.create({
      data: {
        name: "Marrakech",
        country: "Morocco",
        latitude: 31.6295,
        longitude: -7.9811,
        population: 928850,
        timezone: "Africa/Casablanca",
      },
    }),
    // 9 — Buenos Aires
    prisma.city.create({
      data: {
        name: "Buenos Aires",
        country: "Argentina",
        latitude: -34.6037,
        longitude: -58.3816,
        population: 3075646,
        timezone: "America/Argentina/Buenos_Aires",
      },
    }),
    // 10 — Kyoto
    prisma.city.create({
      data: {
        name: "Kyoto",
        country: "Japan",
        latitude: 35.0116,
        longitude: 135.7681,
        population: 1475183,
        timezone: "Asia/Tokyo",
      },
    }),
    // 11 — Lisbon
    prisma.city.create({
      data: {
        name: "Lisbon",
        country: "Portugal",
        latitude: 38.7223,
        longitude: -9.1393,
        population: 544851,
        timezone: "Europe/Lisbon",
      },
    }),
    // 12 — Mexico City
    prisma.city.create({
      data: {
        name: "Mexico City",
        country: "Mexico",
        latitude: 19.4326,
        longitude: -99.1332,
        population: 9209944,
        timezone: "America/Mexico_City",
      },
    }),
    // 13 — Istanbul
    prisma.city.create({
      data: {
        name: "Istanbul",
        country: "Turkey",
        latitude: 41.0082,
        longitude: 28.9784,
        population: 15460000,
        timezone: "Europe/Istanbul",
      },
    }),
  ]);

  console.log(`Created ${cities.length} cities`);

  // ── Visits ────────────────────────────────────────────────
  const visits = await Promise.all([
    // Tokyo — first trip, golden week madness
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[0].id,
        rating: 92,
        comment:
          "Arrived during Golden Week — the energy was electric. Got lost in Shimokitazawa's vintage shops and ate the best ramen of my life at a standing bar under the Yurakucho tracks.",
        startDate: new Date("2023-04-28"),
        endDate: new Date("2023-05-05"),
        tripType: "solo",
        budgetLevel: "moderate",
        wouldReturn: true,
        highlights:
          "Shimokitazawa thrift stores, Yurakucho ramen alley, Meiji Shrine at dawn, Akihabara arcades",
        transport: "flew",
      },
    }),
    // Tokyo — cherry blossom return
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[0].id,
        rating: 97,
        comment:
          "Came back specifically for cherry blossom season. Sat under the sakura in Ueno Park with a bento and sake — genuinely one of the happiest afternoons of my life.",
        startDate: new Date("2025-03-28"),
        endDate: new Date("2025-04-04"),
        tripType: "couple",
        budgetLevel: "expensive",
        wouldReturn: true,
        highlights:
          "Hanami in Ueno Park, teamLab Planets barefoot, Tsukiji outer market tuna auction, Harajuku on a Sunday",
        transport: "flew",
      },
    }),
    // Paris — rainy but romantic
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[1].id,
        rating: 84,
        comment:
          "It rained almost every day but somehow that made it more charming. Spent hours in the Musee d'Orsay. The crepes near Montmartre are unfairly good.",
        startDate: new Date("2024-02-12"),
        endDate: new Date("2024-02-16"),
        tripType: "couple",
        budgetLevel: "expensive",
        wouldReturn: true,
        highlights:
          "Musee d'Orsay impressionists, crepes in Montmartre, Shakespeare and Company bookshop, Seine at dusk",
        transport: "train",
      },
    }),
    // New York — chaotic solo trip
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[2].id,
        rating: 79,
        comment:
          "NYC is exhausting in the best way. Walked 25km on day one. The jazz club in the Village was a highlight — tiny room, incredible musicians.",
        startDate: new Date("2024-01-08"),
        endDate: new Date("2024-01-12"),
        tripType: "solo",
        budgetLevel: "expensive",
        wouldReturn: true,
        highlights:
          "Village Vanguard jazz, Central Park in snow, Brooklyn Bridge sunrise, pizza in Williamsburg",
        transport: "flew",
      },
    }),
    // New York — work trip
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[2].id,
        rating: 65,
        comment:
          "Conference in Midtown. Didn't get to explore much but squeezed in a morning run through Central Park and a late-night slice on the way back.",
        startDate: new Date("2025-06-02"),
        endDate: new Date("2025-06-04"),
        tripType: "business",
        budgetLevel: "luxury",
        wouldReturn: true,
        highlights: "Central Park morning jog, Michelin dinner with clients",
        transport: "flew",
      },
    }),
    // Sydney — summer road trip
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[3].id,
        rating: 88,
        comment:
          "Rented a van and drove up the coast from Sydney. Bondi at 6am with barely anyone around is something else. The harbor at sunset looks photoshopped.",
        startDate: new Date("2023-12-20"),
        endDate: new Date("2023-12-28"),
        tripType: "friends",
        budgetLevel: "moderate",
        wouldReturn: true,
        highlights:
          "Bondi sunrise swim, Opera House at night, Blue Mountains hike, fish and chips at Watson's Bay",
        transport: "flew",
      },
    }),
    // Cape Town — wine country detour
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[4].id,
        rating: 93,
        comment:
          "Table Mountain at sunset was a spiritual experience. Rented a car and spent two days doing wine tastings in Stellenbosch and Franschhoek. Penguins at Boulders Beach were the cherry on top.",
        startDate: new Date("2024-09-05"),
        endDate: new Date("2024-09-12"),
        tripType: "couple",
        budgetLevel: "moderate",
        wouldReturn: true,
        highlights:
          "Table Mountain sunset, Stellenbosch wine route, Boulders Beach penguins, Bo-Kaap colorful houses, Chapman's Peak drive",
        transport: "flew",
      },
    }),
    // Barcelona — quick train stop
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[5].id,
        rating: 76,
        comment:
          "Only had a day — hopped off the train from Paris. La Sagrada Familia was even more stunning than I expected. Wish I'd had more time for the Gothic Quarter.",
        startDate: new Date("2024-02-17"),
        endDate: null,
        tripType: "couple",
        budgetLevel: "budget",
        wouldReturn: true,
        highlights: "Sagrada Familia interior, Las Ramblas, Gothic Quarter wander",
        transport: "train",
      },
    }),
    // Bangkok — street food heaven
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[6].id,
        rating: 83,
        comment:
          "The street food alone is worth the flight. Ate pad thai from a cart at 2am in Chinatown. The Grand Palace was overwhelming in the best way. Took a longtail boat through the canals.",
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-01-21"),
        tripType: "solo",
        budgetLevel: "budget",
        wouldReturn: true,
        highlights:
          "Chinatown street food at midnight, Grand Palace, Wat Pho reclining Buddha, canal longtail boat tour, Chatuchak weekend market",
        transport: "flew",
      },
    }),
    // Reykjavik — northern lights chase
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[7].id,
        rating: 91,
        comment:
          "Drove the Golden Circle in a snowstorm and it was worth every white-knuckle moment. Saw the northern lights on our last night — we stood outside in -10C for an hour and nobody cared about the cold.",
        startDate: new Date("2024-11-14"),
        endDate: new Date("2024-11-19"),
        tripType: "couple",
        budgetLevel: "expensive",
        wouldReturn: true,
        highlights:
          "Northern lights at Thingvellir, Blue Lagoon, Gullfoss waterfall in snow, Hallgrimskirkja, hot dogs at Baejarins Beztu",
        transport: "flew",
      },
    }),
    // Marrakech — sensory overload
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[8].id,
        rating: 80,
        comment:
          "The medina is like stepping into another century. Got hopelessly lost three times and loved it. The riad we stayed in had the most peaceful courtyard. Jemaa el-Fnaa at night is sensory overload in the best way.",
        startDate: new Date("2024-05-01"),
        endDate: new Date("2024-05-05"),
        tripType: "couple",
        budgetLevel: "budget",
        wouldReturn: true,
        highlights:
          "Jemaa el-Fnaa night market, riad courtyard breakfast, leather tanneries, Jardin Majorelle, haggling in the souks",
        transport: "flew",
      },
    }),
    // Buenos Aires — tango and steak
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[9].id,
        rating: 87,
        comment:
          "Buenos Aires has a melancholy beauty that gets under your skin. The steak is absurdly good and absurdly cheap. Watched a tango show in San Telmo that brought me to tears. La Boca is pure color.",
        startDate: new Date("2024-03-10"),
        endDate: new Date("2024-03-17"),
        tripType: "solo",
        budgetLevel: "budget",
        wouldReturn: true,
        highlights:
          "San Telmo tango show, parrilla in Palermo, La Boca street art, Recoleta Cemetery, late-night milonga",
        transport: "flew",
      },
    }),
    // Kyoto — temples in autumn
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[10].id,
        rating: 96,
        comment:
          "Kyoto in autumn is the most beautiful place I've ever seen. The red maples at Tofukuji made me stop breathing. Fushimi Inari at 5:30am — completely alone with ten thousand torii gates. This is the trip I'll remember when I'm old.",
        startDate: new Date("2023-11-10"),
        endDate: new Date("2023-11-16"),
        tripType: "solo",
        budgetLevel: "moderate",
        wouldReturn: true,
        highlights:
          "Fushimi Inari at dawn, Tofukuji autumn leaves, Arashiyama bamboo grove, kaiseki dinner in Gion, Kinkaku-ji in afternoon light",
        transport: "train",
      },
    }),
    // Lisbon — tiles and pasteis
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[11].id,
        rating: 89,
        comment:
          "Lisbon stole my heart. Every street has those gorgeous azulejo tiles, every corner has a pasteis de nata. Rode tram 28 like a tourist and loved every second. The sunset from Miradouro da Graca was absurd.",
        startDate: new Date("2025-05-18"),
        endDate: new Date("2025-05-23"),
        tripType: "friends",
        budgetLevel: "moderate",
        wouldReturn: true,
        highlights:
          "Tram 28, pasteis de nata at Manteigaria, Miradouro da Graca sunset, Time Out Market, Alfama fado bar",
        transport: "flew",
      },
    }),
    // Mexico City — food pilgrimage
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[12].id,
        rating: 90,
        comment:
          "Went specifically for the food and it exceeded every expectation. Tacos al pastor from a street cart at midnight. The Frida Kahlo museum hit different than I expected — intimate and raw. Chapultepec Park on a Sunday is pure joy.",
        startDate: new Date("2025-08-05"),
        endDate: new Date("2025-08-11"),
        tripType: "friends",
        budgetLevel: "budget",
        wouldReturn: true,
        highlights:
          "Tacos al pastor at El Huequito, Frida Kahlo museum, Chapultepec Sunday, mezcal in Roma Norte, Teotihuacan pyramids day trip",
        transport: "flew",
      },
    }),
    // Istanbul — bridges between worlds
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[13].id,
        rating: 86,
        comment:
          "A city that literally bridges two continents and it shows in everything — the food, the architecture, the people. The Blue Mosque and Hagia Sophia back to back left me speechless. Turkish breakfast is a whole event.",
        startDate: new Date("2025-10-01"),
        endDate: new Date("2025-10-06"),
        tripType: "solo",
        budgetLevel: "moderate",
        wouldReturn: true,
        highlights:
          "Hagia Sophia, Blue Mosque, Grand Bazaar, Bosphorus ferry at sunset, Turkish breakfast spread, Balat neighborhood",
        transport: "flew",
      },
    }),
  ]);

  console.log(`Created ${visits.length} visits`);
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
