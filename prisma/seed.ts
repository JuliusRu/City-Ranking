import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data for fresh seed
  await prisma.userSettings.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  // Create user
  const user = await prisma.user.create({
    data: {
      id: "default-user",
      name: "Julius",
      email: "julius@cityranking.app",
    },
  });

  console.log("Created user:", user.name);

  await prisma.userSettings.create({
    data: {
      userId: user.id,
      theme: "dark",
      dateFormat: "DD.MM.YYYY",
      defaultSortBy: "rating",
      defaultSortOrder: "desc",
      homeCurrency: "EUR",
      distanceUnit: "km",
    },
  });

  console.log("Created user settings");

  // ── Cities ────────────────────────────────────────────────
  const cities = await Promise.all([
    // 0 — Frankfurt
    prisma.city.create({
      data: {
        name: "Frankfurt",
        country: "Germany",
        state: "Hessen",
        latitude: 50.1109,
        longitude: 8.6821,
        population: 773068,
        timezone: "Europe/Berlin",
      },
    }),
    // 1 — London
    prisma.city.create({
      data: {
        name: "London",
        country: "United Kingdom",
        state: "England",
        latitude: 51.5074,
        longitude: -0.1278,
        population: 8982000,
        timezone: "Europe/London",
      },
    }),
    // 2 — Hamburg
    prisma.city.create({
      data: {
        name: "Hamburg",
        country: "Germany",
        latitude: 53.5511,
        longitude: 9.9937,
        population: 1945532,
        timezone: "Europe/Berlin",
      },
    }),
    // 3 — Melbourne
    prisma.city.create({
      data: {
        name: "Melbourne",
        country: "Australia",
        state: "Victoria",
        latitude: -37.8136,
        longitude: 144.9631,
        population: 5078193,
        timezone: "Australia/Melbourne",
      },
    }),
    // 4 — Hong Kong
    prisma.city.create({
      data: {
        name: "Hong Kong",
        country: "China (SAR)",
        latitude: 22.3193,
        longitude: 114.1694,
        population: 7500700,
        timezone: "Asia/Hong_Kong",
      },
    }),
    // 5 — Rotterdam
    prisma.city.create({
      data: {
        name: "Rotterdam",
        country: "Netherlands",
        state: "South Holland",
        latitude: 51.9244,
        longitude: 4.4777,
        population: 651446,
        timezone: "Europe/Amsterdam",
      },
    }),
    // 6 — Wien
    prisma.city.create({
      data: {
        name: "Wien",
        country: "Austria",
        latitude: 48.2082,
        longitude: 16.3738,
        population: 1911191,
        timezone: "Europe/Vienna",
      },
    }),
    // 7 — Paris
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
    // 8 — Rom
    prisma.city.create({
      data: {
        name: "Rom",
        country: "Italy",
        latitude: 41.9028,
        longitude: 12.4964,
        population: 2873000,
        timezone: "Europe/Rome",
      },
    }),
    // 9 — Sydney
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
    // 10 — München
    prisma.city.create({
      data: {
        name: "München",
        country: "Germany",
        state: "Bayern",
        latitude: 48.1351,
        longitude: 11.582,
        population: 1512491,
        timezone: "Europe/Berlin",
      },
    }),
    // 11 — Kuala Lumpur
    prisma.city.create({
      data: {
        name: "Kuala Lumpur",
        country: "Malaysia",
        latitude: 3.139,
        longitude: 101.6869,
        population: 1982000,
        timezone: "Asia/Kuala_Lumpur",
      },
    }),
    // 12 — Amsterdam
    prisma.city.create({
      data: {
        name: "Amsterdam",
        country: "Netherlands",
        state: "North Holland",
        latitude: 52.3676,
        longitude: 4.9041,
        population: 907976,
        timezone: "Europe/Amsterdam",
      },
    }),
    // 13 — Prag
    prisma.city.create({
      data: {
        name: "Prag",
        country: "Czech Republic",
        latitude: 50.0755,
        longitude: 14.4378,
        population: 1335084,
        timezone: "Europe/Prague",
      },
    }),
    // 14 — Berlin
    prisma.city.create({
      data: {
        name: "Berlin",
        country: "Germany",
        latitude: 52.52,
        longitude: 13.405,
        population: 3748148,
        timezone: "Europe/Berlin",
      },
    }),
    // 15 — Budapest
    prisma.city.create({
      data: {
        name: "Budapest",
        country: "Hungary",
        latitude: 47.4979,
        longitude: 19.0402,
        population: 1752286,
        timezone: "Europe/Budapest",
      },
    }),
    // 16 — Stockholm
    prisma.city.create({
      data: {
        name: "Stockholm",
        country: "Sweden",
        latitude: 59.3293,
        longitude: 18.0686,
        population: 978770,
        timezone: "Europe/Stockholm",
      },
    }),
    // 17 — Los Angeles
    prisma.city.create({
      data: {
        name: "Los Angeles",
        country: "United States",
        state: "California",
        latitude: 34.0522,
        longitude: -118.2437,
        population: 3898747,
        timezone: "America/Los_Angeles",
      },
    }),
    // 18 — Kiew
    prisma.city.create({
      data: {
        name: "Kiew",
        country: "Ukraine",
        latitude: 50.4501,
        longitude: 30.5234,
        population: 2962180,
        timezone: "Europe/Kiev",
      },
    }),
    // 19 — Köln
    prisma.city.create({
      data: {
        name: "Köln",
        country: "Germany",
        state: "Nordrhein-Westfalen",
        latitude: 50.9375,
        longitude: 6.9603,
        population: 1083498,
        timezone: "Europe/Berlin",
      },
    }),
    // 20 — Bangkok
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
    // 21 — San Francisco
    prisma.city.create({
      data: {
        name: "San Francisco",
        country: "United States",
        state: "California",
        latitude: 37.7749,
        longitude: -122.4194,
        population: 873965,
        timezone: "America/Los_Angeles",
      },
    }),
    // 22 — San Diego
    prisma.city.create({
      data: {
        name: "San Diego",
        country: "United States",
        state: "California",
        latitude: 32.7157,
        longitude: -117.1611,
        population: 1423851,
        timezone: "America/Los_Angeles",
      },
    }),
    // 23 — Athen
    prisma.city.create({
      data: {
        name: "Athen",
        country: "Greece",
        latitude: 37.9838,
        longitude: 23.7275,
        population: 664046,
        timezone: "Europe/Athens",
      },
    }),
    // 24 — Las Vegas
    prisma.city.create({
      data: {
        name: "Las Vegas",
        country: "United States",
        state: "Nevada",
        latitude: 36.1699,
        longitude: -115.1398,
        population: 641903,
        timezone: "America/Los_Angeles",
      },
    }),
    // 25 — Phnom Penh
    prisma.city.create({
      data: {
        name: "Phnom Penh",
        country: "Cambodia",
        latitude: 11.5564,
        longitude: 104.9282,
        population: 2129371,
        timezone: "Asia/Phnom_Penh",
      },
    }),
    // 26 — Tunis
    prisma.city.create({
      data: {
        name: "Tunis",
        country: "Tunisia",
        latitude: 36.8065,
        longitude: 10.1815,
        population: 693210,
        timezone: "Africa/Tunis",
      },
    }),
    // 27 — Brüssel
    prisma.city.create({
      data: {
        name: "Brüssel",
        country: "Belgium",
        latitude: 50.8503,
        longitude: 4.3517,
        population: 1209000,
        timezone: "Europe/Brussels",
      },
    }),
  ]);

  console.log(`Created ${cities.length} cities`);

  // ── Visits ────────────────────────────────────────────────
  // Since only years are known, startDate uses July 1 of that year.
  // For cities with multiple visit years, each year becomes a separate visit.
  // The comment is attached to the most recent visit only.
  const d = (year: number) => new Date(`${year}-07-01`);

  const visits = await Promise.all([
    // Frankfurt — 2015, 2019, 2022
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[0].id,
        rating: 92,
        startDate: d(2015),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[0].id,
        rating: 92,
        startDate: d(2019),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[0].id,
        rating: 92,
        comment: "Einfach die beste Stadt in DE",
        startDate: d(2022),
        tripType: "solo",
      },
    }),

    // London — 2022, 2025
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[1].id,
        rating: 91,
        startDate: d(2022),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[1].id,
        rating: 91,
        comment:
          "Spannende Stadt, bester Gebäudemix – Nachtleben ausbaufähig",
        startDate: d(2025),
        tripType: "solo",
      },
    }),

    // Hamburg — 2017, 2018–2024
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[2].id,
        rating: 88,
        startDate: d(2017),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[2].id,
        rating: 88,
        comment: "Die vielfältigste Stadt in DE",
        startDate: d(2018),
        endDate: new Date("2024-07-01"),
        tripType: "solo",
      },
    }),

    // Melbourne — 2016
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[3].id,
        rating: 85,
        comment:
          "Guter Mix aus Megacity, Natur (Strand etc) gute Hochhäuser",
        startDate: d(2016),
        tripType: "solo",
      },
    }),

    // Hong Kong — 2012, 2017
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[4].id,
        rating: 85,
        startDate: d(2012),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[4].id,
        rating: 85,
        comment: "Spannend, sicher und aufregend + viele Hochhäuser",
        startDate: d(2017),
        tripType: "solo",
      },
    }),

    // Rotterdam — 2022
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[5].id,
        rating: 84,
        comment: "Tolle Gebäude",
        startDate: d(2022),
        tripType: "solo",
      },
    }),

    // Wien — 2016, 2021
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[6].id,
        rating: 83,
        startDate: d(2016),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[6].id,
        rating: 83,
        comment: "Abwechslungsreich, tolle moderne & historische Gebäude",
        startDate: d(2021),
        tripType: "solo",
      },
    }),

    // Paris — 2019, 2025
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[7].id,
        rating: 82,
        startDate: d(2019),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[7].id,
        rating: 82,
        comment:
          "Beide Besuche über Erwartungen, scheint im langsamen Untergang zu sein",
        startDate: d(2025),
        tripType: "solo",
      },
    }),

    // Rom — 2013
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[8].id,
        rating: 81,
        comment:
          "Spannende Historie, doch wenig modernes / globales Gefühl",
        startDate: d(2013),
        tripType: "solo",
      },
    }),

    // Sydney — 2012, 2016
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[9].id,
        rating: 80,
        startDate: d(2012),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[9].id,
        rating: 80,
        comment:
          "Nahezu perfekte Stadt – wenig Hügel, gutes Wetter, viele Hochhäuser",
        startDate: d(2016),
        tripType: "solo",
      },
    }),

    // München — no specific year
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[10].id,
        rating: 80,
        comment: "Zu wenig Hochhäuser",
        startDate: d(2020),
        tripType: "solo",
      },
    }),

    // Kuala Lumpur — 2018
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[11].id,
        rating: 79,
        comment: "Spannende wachsende Stadt, etwas zu weitläufig",
        startDate: d(2018),
        tripType: "solo",
      },
    }),

    // Amsterdam — 2018
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[12].id,
        rating: 79,
        comment: "Fast erfroren",
        startDate: d(2018),
        tripType: "solo",
      },
    }),

    // Prag — 2021
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[13].id,
        rating: 78,
        comment: "Nette Stadt",
        startDate: d(2021),
        tripType: "solo",
      },
    }),

    // Berlin — 2010, 2020, 2021, 2023
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[14].id,
        rating: 77,
        startDate: d(2010),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[14].id,
        rating: 77,
        startDate: d(2020),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[14].id,
        rating: 77,
        startDate: d(2021),
        tripType: "solo",
      },
    }),
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[14].id,
        rating: 77,
        comment: "Aufregende Stadt",
        startDate: d(2023),
        tripType: "solo",
      },
    }),

    // Budapest — 2021
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[15].id,
        rating: 77,
        comment: "Ganz ok, zu wenig moderne Gebäude",
        startDate: d(2021),
        tripType: "solo",
      },
    }),

    // Stockholm — 2025
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[16].id,
        rating: 75,
        comment: "Unter den Erwartungen",
        startDate: d(2025),
        tripType: "solo",
      },
    }),

    // Los Angeles — 2014
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[17].id,
        rating: 75,
        comment: "Erste Megacity, war cool mit Ron",
        startDate: d(2014),
        tripType: "friends",
      },
    }),

    // Kiew — 2019
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[18].id,
        rating: 74,
        comment:
          "Man kann gut leben, sehr hügelig, zu viele Kommunistengebäude",
        startDate: d(2019),
        tripType: "solo",
      },
    }),

    // Köln — no specific year
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[19].id,
        rating: 70,
        comment: "Zu dreckig, aber der Dom ist cool",
        startDate: d(2020),
        tripType: "solo",
      },
    }),

    // Bangkok — 2018
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[20].id,
        rating: 70,
        comment: "War leider krank und habe nicht viel gesehen",
        startDate: d(2018),
        tripType: "solo",
      },
    }),

    // San Francisco — 2014
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[21].id,
        rating: 70,
        comment:
          "Unter Vorstellungen, zu hügelig, zu viele Obdachlose",
        startDate: d(2014),
        tripType: "solo",
      },
    }),

    // San Diego — 2014
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[22].id,
        rating: 70,
        comment: "Wenig von der Stadt gesehen",
        startDate: d(2014),
        tripType: "solo",
      },
    }),

    // Athen — 2024
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[23].id,
        rating: 69,
        comment:
          "Dreckig, unordentlich, zu wenig Grün – Geschichte ist cool",
        startDate: d(2024),
        tripType: "solo",
      },
    }),

    // Las Vegas — 2014
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[24].id,
        rating: 63,
        comment: "Zu künstlich, war zu jung",
        startDate: d(2014),
        tripType: "solo",
      },
    }),

    // Phnom Penh — 2018
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[25].id,
        rating: 60,
        comment: "Zu unterentwickelt",
        startDate: d(2018),
        tripType: "solo",
      },
    }),

    // Tunis — 2024
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[26].id,
        rating: 60,
        comment: "Unfreundliche Menschen, Essen hat krank gemacht",
        startDate: d(2024),
        tripType: "solo",
      },
    }),

    // Brüssel — 2025
    prisma.visit.create({
      data: {
        userId: user.id,
        cityId: cities[27].id,
        rating: 32,
        comment: "Hässlich",
        startDate: d(2025),
        tripType: "solo",
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
