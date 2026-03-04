import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Deterministic PRNG (linear congruential generator)
// Same seed always produces the same sequence.
// ---------------------------------------------------------------------------
function createRng(seed: number) {
  let state = seed;
  return {
    /** Returns a float in [0, 1) */
    next(): number {
      state = (state * 1664525 + 1013904223) & 0x7fffffff;
      return state / 0x7fffffff;
    },
    /** Returns an integer in [min, max] inclusive */
    int(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    /** Pick n unique items from arr (deterministic shuffle-pick) */
    pick<T>(arr: T[], n: number): T[] {
      const copy = [...arr];
      const result: T[] = [];
      for (let i = 0; i < n && copy.length > 0; i++) {
        const idx = this.int(0, copy.length - 1);
        result.push(copy.splice(idx, 1)[0]);
      }
      return result;
    },
  };
}

// ---------------------------------------------------------------------------
// Deterministic UUID v4 generator from a seed integer.
// Format: 8-4-4-4-12 hex, version nibble = 4, variant bits = 10xx.
// ---------------------------------------------------------------------------
function deterministicUuid(seed: number): string {
  const rng = createRng(seed);
  const hex = () =>
    Math.floor(rng.next() * 16)
      .toString(16)
      .toLowerCase();
  const bytes = Array.from({ length: 32 }, () => hex()).join('');
  // Insert hyphens, set version (4) and variant (8-b)
  const v = bytes.slice(0, 8) + '-' + bytes.slice(8, 12) + '-4' + bytes.slice(13, 16) + '-' +
    ((8 + (parseInt(bytes[16], 16) & 0x3)).toString(16)) + bytes.slice(17, 20) + '-' + bytes.slice(20, 32);
  return v;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function daysAgo(days: number): Date {
  const d = new Date('2026-03-03T12:00:00Z');
  d.setDate(d.getDate() - days);
  return d;
}

// ---------------------------------------------------------------------------
// NEIGHBORHOODS (50 entries across 12 cities)
// ---------------------------------------------------------------------------
interface NeighborhoodSeed {
  id: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  latitude: number;
  longitude: number;
}

const neighborhoods: NeighborhoodSeed[] = [
  // --- New York (7) ---
  {
    id: deterministicUuid(1001),
    name: 'Greenwich Village',
    city: 'New York',
    state: 'NY',
    zip: '10014',
    description:
      'Dense cafe coverage and solid wifi everywhere. Walkability is near-perfect but noise levels spike at night around Bleecker. Expensive, but you can post up in a coffee shop all day without anyone bothering you.',
    latitude: 40.7335,
    longitude: -74.0027,
  },
  {
    id: deterministicUuid(1002),
    name: 'Williamsburg',
    city: 'New York',
    state: 'NY',
    zip: '11211',
    description:
      'Overpriced but the cafe-to-block ratio is unbeatable. Every other storefront has fast wifi and outlets. Gets loud on weekends near Bedford Ave, quieter east of the BQE.',
    latitude: 40.7081,
    longitude: -73.9571,
  },
  {
    id: deterministicUuid(1003),
    name: 'Park Slope',
    city: 'New York',
    state: 'NY',
    zip: '11215',
    description:
      'Quieter residential vibe with enough cafes along 5th and 7th Ave to work from. Prospect Park is a good midday reset. Stroller-heavy but wifi is reliable and rents are slightly less brutal than Manhattan.',
    latitude: 40.6710,
    longitude: -73.9777,
  },
  {
    id: deterministicUuid(1004),
    name: 'Astoria',
    city: 'New York',
    state: 'NY',
    zip: '11106',
    description:
      'Best value in NYC for remote workers. Diverse food scene, decent cafe options along Broadway and 30th Ave. The N/W train gets you to Midtown in 20 minutes. Wifi quality varies by building.',
    latitude: 40.7592,
    longitude: -73.9196,
  },
  {
    id: deterministicUuid(1005),
    name: 'Upper West Side',
    city: 'New York',
    state: 'NY',
    zip: '10024',
    description:
      'Calm, tree-lined blocks near Central Park. Fewer trendy cafes but the ones that exist are spacious. Good for focused deep work. The neighborhood empties out during the day, which is a feature.',
    latitude: 40.7870,
    longitude: -73.9754,
  },
  {
    id: deterministicUuid(1006),
    name: 'Harlem',
    city: 'New York',
    state: 'NY',
    zip: '10030',
    description:
      'Underrated for remote work. Rents are lower, cafes are less crowded, and the food is incredible. Marcus Garvey Park area is chill. Wifi in newer buildings is solid, older walk-ups can be spotty.',
    latitude: 40.8116,
    longitude: -73.9465,
  },
  {
    id: deterministicUuid(1007),
    name: 'East Village',
    city: 'New York',
    state: 'NY',
    zip: '10003',
    description:
      'High density of laptop-friendly cafes and bars with wifi. Tompkins Square area is walkable to everything. Loud at night, but during working hours it is one of the most productive neighborhoods in the city.',
    latitude: 40.7265,
    longitude: -73.9815,
  },

  // --- San Francisco (5) ---
  {
    id: deterministicUuid(2001),
    name: 'Mission District',
    city: 'San Francisco',
    state: 'CA',
    zip: '94110',
    description:
      'Sunny microclimate, wall-to-wall cafes, and strong wifi culture. Valencia Street is remote worker paradise. Cost is high but so is the concentration of good work spots per block.',
    latitude: 37.7599,
    longitude: -122.4148,
  },
  {
    id: deterministicUuid(2002),
    name: 'Hayes Valley',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    description:
      'Compact, walkable, and full of small cafes. Patricia\'s Green is a nice outdoor break spot. Quiet during the day, gets busier in the evening. Pricey rents but the walkability makes up for it.',
    latitude: 37.7759,
    longitude: -122.4245,
  },
  {
    id: deterministicUuid(2003),
    name: 'Castro',
    city: 'San Francisco',
    state: 'CA',
    zip: '94114',
    description:
      'Tight-knit neighborhood with solid cafe options. Hilly but walkable within its core. Quieter than Mission or SOMA during the day. Good for people who want a neighborhood that feels like a neighborhood.',
    latitude: 37.7609,
    longitude: -122.4350,
  },
  {
    id: deterministicUuid(2004),
    name: 'Noe Valley',
    city: 'San Francisco',
    state: 'CA',
    zip: '94114',
    description:
      'Residential and quiet with a few solid work cafes on 24th Street. Families and dogs everywhere. If you need silence and sunlight, this is one of the better SF picks. Limited nightlife.',
    latitude: 37.7502,
    longitude: -122.4337,
  },
  {
    id: deterministicUuid(2005),
    name: 'SOMA',
    city: 'San Francisco',
    state: 'CA',
    zip: '94103',
    description:
      'Tech company overflow zone. Coworking spaces on every block, fast internet everywhere. The streets are gritty and not particularly walkable for errands. Better for heads-down work than lifestyle.',
    latitude: 37.7785,
    longitude: -122.3950,
  },

  // --- Los Angeles (5) ---
  {
    id: deterministicUuid(3001),
    name: 'Silver Lake',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90026',
    description:
      'LA\'s best neighborhood for remote workers who want walkability (by LA standards). Sunset Blvd has a string of good cafes. You still need a car for groceries. Hills keep it quiet.',
    latitude: 34.0869,
    longitude: -118.2702,
  },
  {
    id: deterministicUuid(3002),
    name: 'Venice',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90291',
    description:
      'Beach access is the draw. Abbot Kinney has cafes but they are crowded and performative. Wifi in rentals is usually solid. Cost is absurd for what you get. Best if you need ocean proximity to function.',
    latitude: 33.9850,
    longitude: -118.4695,
  },
  {
    id: deterministicUuid(3003),
    name: 'Echo Park',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90026',
    description:
      'Scrappier Silver Lake. Fewer polished cafes but the ones that exist are less crowded. The lake is a nice walk. Rent is slightly cheaper. Sunset Blvd strip has most of what you need.',
    latitude: 34.0782,
    longitude: -118.2606,
  },
  {
    id: deterministicUuid(3004),
    name: 'Highland Park',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90042',
    description:
      'Best value in northeast LA. Figueroa Street has a growing cafe scene. Gold Line access is handy. Still gentrifying, so options are improving fast. Wifi quality varies by block.',
    latitude: 34.1114,
    longitude: -118.1901,
  },
  {
    id: deterministicUuid(3005),
    name: 'Los Feliz',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90027',
    description:
      'Quiet, leafy, and adjacent to Griffith Park. Vermont and Hillhurst have the cafes. Less hip than Silver Lake, more livable. Good for longer stays where you want routine over novelty.',
    latitude: 34.1062,
    longitude: -118.2844,
  },

  // --- Chicago (5) ---
  {
    id: deterministicUuid(4001),
    name: 'Wicker Park',
    city: 'Chicago',
    state: 'IL',
    zip: '60622',
    description:
      'Dense with cafes and coworking-friendly spots along Milwaukee Ave. Very walkable, Blue Line access. Gets loud on weekend nights. Affordable compared to coastal equivalents.',
    latitude: 41.9073,
    longitude: -87.6776,
  },
  {
    id: deterministicUuid(4002),
    name: 'Logan Square',
    city: 'Chicago',
    state: 'IL',
    zip: '60647',
    description:
      'Slightly cheaper Wicker Park with more breathing room. The boulevard system is great for walks. Cafe scene is strong along Milwaukee. Blue Line keeps you connected. Winters are brutal.',
    latitude: 41.9234,
    longitude: -87.7076,
  },
  {
    id: deterministicUuid(4003),
    name: 'Lincoln Park',
    city: 'Chicago',
    state: 'IL',
    zip: '60614',
    description:
      'Safe, clean, and close to the lakefront. More chain cafes than indie spots. The park itself is a great midday break. Skews younger and more polished. Reliable wifi in most buildings.',
    latitude: 41.9214,
    longitude: -87.6513,
  },
  {
    id: deterministicUuid(4004),
    name: 'Pilsen',
    city: 'Chicago',
    state: 'IL',
    zip: '60608',
    description:
      'Best food value in Chicago, hands down. Growing cafe scene along 18th Street. Strong arts community. Pink Line access. Gentrifying fast, which means more work-friendly spots opening regularly.',
    latitude: 41.8565,
    longitude: -87.6564,
  },
  {
    id: deterministicUuid(4005),
    name: 'Bucktown',
    city: 'Chicago',
    state: 'IL',
    zip: '60647',
    description:
      'Wicker Park\'s quieter sibling. More residential, fewer bars, same Blue Line access. Damen Ave has a few dependable cafes. Good for people who want the neighborhood without the weekend crowds.',
    latitude: 41.9120,
    longitude: -87.6798,
  },

  // --- Seattle (4) ---
  {
    id: deterministicUuid(5001),
    name: 'Capitol Hill',
    city: 'Seattle',
    state: 'WA',
    zip: '98102',
    description:
      'Seattle\'s most walkable neighborhood. Cafe density is extremely high along Pike/Pine. Loud nightlife corridor, but daytime is productive. Good transit. Rent is steep but you can ditch the car.',
    latitude: 47.6205,
    longitude: -122.3212,
  },
  {
    id: deterministicUuid(5002),
    name: 'Fremont',
    city: 'Seattle',
    state: 'WA',
    zip: '98103',
    description:
      'Quirky and quieter than Capitol Hill. A few solid cafes near the canal. More residential, good for focused work. The Burke-Gilman Trail is right there for breaks. Bus access is decent.',
    latitude: 47.6588,
    longitude: -122.3503,
  },
  {
    id: deterministicUuid(5003),
    name: 'Ballard',
    city: 'Seattle',
    state: 'WA',
    zip: '98107',
    description:
      'Former Scandinavian fishing village turned brewery district. Cafe options along Ballard Ave and Market St. Walkable core but spread out edges. Good for people who want a slower pace than Capitol Hill.',
    latitude: 47.6677,
    longitude: -122.3839,
  },
  {
    id: deterministicUuid(5004),
    name: 'Wallingford',
    city: 'Seattle',
    state: 'WA',
    zip: '98103',
    description:
      'Residential, quiet, family-oriented. A handful of cafes along 45th Street. Gas Works Park for breaks. Less nightlife, more focus. Good for people who want to live somewhere, not visit somewhere.',
    latitude: 47.6615,
    longitude: -122.3350,
  },

  // --- Austin (5) ---
  {
    id: deterministicUuid(6001),
    name: 'East Austin',
    city: 'Austin',
    state: 'TX',
    zip: '78702',
    description:
      'Ground zero for Austin remote workers. Every other building is a cafe or coworking space. Walkable by Texas standards. Hot as hell in summer but the wifi is fast and the tacos are cheap.',
    latitude: 30.2598,
    longitude: -97.7226,
  },
  {
    id: deterministicUuid(6002),
    name: 'South Congress',
    city: 'Austin',
    state: 'TX',
    zip: '78704',
    description:
      'Tourist-heavy on the main strip but residential side streets are quiet. Good cafes scattered around. Walkable to downtown across the bridge. Cost has climbed significantly in the last few years.',
    latitude: 30.2480,
    longitude: -97.7487,
  },
  {
    id: deterministicUuid(6003),
    name: 'Zilker',
    city: 'Austin',
    state: 'TX',
    zip: '78704',
    description:
      'Near Barton Springs and the greenbelt. More residential, fewer cafes, but the ones that exist are spacious. You need a car. Best if you prioritize outdoor access over urban density.',
    latitude: 30.2639,
    longitude: -97.7718,
  },
  {
    id: deterministicUuid(6004),
    name: 'Hyde Park',
    city: 'Austin',
    state: 'TX',
    zip: '78751',
    description:
      'Old Austin charm. Tree-lined streets, a few excellent cafes, and quiet residential blocks. UT campus is nearby, which means decent internet infrastructure. Less hype, more substance.',
    latitude: 30.3044,
    longitude: -97.7319,
  },
  {
    id: deterministicUuid(6005),
    name: 'Mueller',
    city: 'Austin',
    state: 'TX',
    zip: '78723',
    description:
      'Planned community on the old airport site. New construction, reliable internet, walkable trails. A few cafes in the town center. Feels suburban but functional. Good if you want quiet and modern.',
    latitude: 30.2980,
    longitude: -97.7055,
  },

  // --- Denver (4) ---
  {
    id: deterministicUuid(7001),
    name: 'RiNo',
    city: 'Denver',
    state: 'CO',
    zip: '80205',
    description:
      'River North Art District. Converted warehouses with coworking spaces and craft coffee. Walkable within the district but isolated from the rest of Denver. Good wifi, industrial aesthetic.',
    latitude: 39.7710,
    longitude: -104.9811,
  },
  {
    id: deterministicUuid(7002),
    name: 'Capitol Hill',
    city: 'Denver',
    state: 'CO',
    zip: '80203',
    description:
      'Denver\'s most walkable neighborhood. Colfax Ave has everything. Cafes, bars, restaurants, all within walking distance. Noisy on Colfax but quiet one block off. Rent is reasonable for what you get.',
    latitude: 39.7312,
    longitude: -104.9826,
  },
  {
    id: deterministicUuid(7003),
    name: 'Highlands',
    city: 'Denver',
    state: 'CO',
    zip: '80211',
    description:
      'Trendy but genuinely pleasant. 32nd Ave and Tennyson St have good cafe clusters. Walkable, quiet streets, mountain views on clear days. Slightly pricier than Cap Hill but worth it for the calm.',
    latitude: 39.7580,
    longitude: -105.0100,
  },
  {
    id: deterministicUuid(7004),
    name: 'Baker',
    city: 'Denver',
    state: 'CO',
    zip: '80209',
    description:
      'South Broadway strip has cafes, thrift shops, and restaurants. Walkable, close to downtown, cheaper than Highlands. Good mix of old and new Denver. The light rail is right there.',
    latitude: 39.7150,
    longitude: -104.9880,
  },

  // --- Portland (3) ---
  {
    id: deterministicUuid(8001),
    name: 'Alberta Arts',
    city: 'Portland',
    state: 'OR',
    zip: '97211',
    description:
      'Alberta Street is a straight line of cafes, galleries, and food. Extremely walkable within its corridor. Quieter side streets for living. Wifi is solid. One of the better value neighborhoods in Portland.',
    latitude: 45.5590,
    longitude: -122.6458,
  },
  {
    id: deterministicUuid(8002),
    name: 'Hawthorne',
    city: 'Portland',
    state: 'OR',
    zip: '97214',
    description:
      'Classic Portland strip. Hawthorne Blvd has reliable cafes with outlets and wifi. Division Street parallel has more options. Bikeable everywhere. Rain 8 months a year but the cafes are cozy.',
    latitude: 45.5118,
    longitude: -122.6290,
  },
  {
    id: deterministicUuid(8003),
    name: 'Pearl District',
    city: 'Portland',
    state: 'OR',
    zip: '97209',
    description:
      'Converted warehouse district, now upscale. Clean, walkable, good transit access. More polished than the rest of Portland. Powell\'s is right here. Rent is highest in the city but the infrastructure is solid.',
    latitude: 45.5265,
    longitude: -122.6830,
  },

  // --- Miami (3) ---
  {
    id: deterministicUuid(9001),
    name: 'Wynwood',
    city: 'Miami',
    state: 'FL',
    zip: '33127',
    description:
      'Art district turned tech hub. Coworking spaces and cafes everywhere. Walkable within the district but you need a car for everything else. Hot year-round. Fast internet, growing nomad community.',
    latitude: 25.8009,
    longitude: -80.1993,
  },
  {
    id: deterministicUuid(9002),
    name: 'Coconut Grove',
    city: 'Miami',
    state: 'FL',
    zip: '33133',
    description:
      'Leafy, walkable village feel inside Miami. CocoWalk area has cafes and restaurants. Quieter and more residential than Wynwood. Good wifi, some coworking options. Expensive but pleasant.',
    latitude: 25.7270,
    longitude: -80.2414,
  },
  {
    id: deterministicUuid(9003),
    name: 'South Beach',
    city: 'Miami',
    state: 'FL',
    zip: '33139',
    description:
      'Tourist trap masquerading as a neighborhood. Wifi in hotels is fine, independent cafes are scarce. Beach access is the only real draw for remote work. Everything costs 30% more than it should.',
    latitude: 25.7907,
    longitude: -80.1300,
  },

  // --- Nashville (3) ---
  {
    id: deterministicUuid(10001),
    name: 'East Nashville',
    city: 'Nashville',
    state: 'TN',
    zip: '37206',
    description:
      'Nashville\'s best neighborhood for remote workers. Five Points area has multiple solid cafes. Walkable core, quiet residential streets. Cost is rising but still reasonable. Strong community vibe.',
    latitude: 36.1742,
    longitude: -86.7462,
  },
  {
    id: deterministicUuid(10002),
    name: 'The Gulch',
    city: 'Nashville',
    state: 'TN',
    zip: '37203',
    description:
      'New development area with modern apartments and restaurants. Very walkable, clean, well-connected. Feels corporate but the infrastructure is excellent. Good wifi, fast food delivery, transit access.',
    latitude: 36.1520,
    longitude: -86.7886,
  },
  {
    id: deterministicUuid(10003),
    name: 'Germantown',
    city: 'Nashville',
    state: 'TN',
    zip: '37208',
    description:
      'Small, historic neighborhood north of downtown. A handful of excellent cafes and restaurants. Very walkable within its few blocks. Quiet during the day. Bieber\'s coffee shop or bust.',
    latitude: 36.1750,
    longitude: -86.7910,
  },

  // --- Washington DC (3) ---
  {
    id: deterministicUuid(11001),
    name: 'Adams Morgan',
    city: 'Washington',
    state: 'DC',
    zip: '20009',
    description:
      '18th Street has cafes and restaurants stacked. Very walkable, loud nightlife on weekends. Diverse food options, solid wifi in most spots. Metro access via Woodley Park. Rent is high but manageable.',
    latitude: 38.9214,
    longitude: -77.0425,
  },
  {
    id: deterministicUuid(11002),
    name: 'Dupont Circle',
    city: 'Washington',
    state: 'DC',
    zip: '20036',
    description:
      'Classic DC neighborhood with Connecticut Ave cafes. Very walkable, Metro right there. Mix of professionals and embassy crowd. Solid wifi infrastructure. Gets quiet on weekends when offices empty.',
    latitude: 38.9096,
    longitude: -77.0434,
  },
  {
    id: deterministicUuid(11003),
    name: 'Shaw',
    city: 'Washington',
    state: 'DC',
    zip: '20001',
    description:
      'Rapidly gentrified with new cafes and restaurants. 9th Street corridor is the main strip. Good Metro access. Walkable, increasingly expensive. The newer buildings have excellent internet.',
    latitude: 38.9120,
    longitude: -77.0218,
  },

  // --- Philadelphia (3) ---
  {
    id: deterministicUuid(12001),
    name: 'Fishtown',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19125',
    description:
      'Philly\'s Williamsburg, for better and worse. Frankford Ave is lined with cafes and bars. Extremely walkable, EL access. Way cheaper than NYC equivalents. Wifi is good, vibes are good, cost is right.',
    latitude: 39.9735,
    longitude: -75.1337,
  },
  {
    id: deterministicUuid(12002),
    name: 'Northern Liberties',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19123',
    description:
      'Adjacent to Fishtown, slightly more residential. 2nd Street has the cafe strip. Piazza area has outdoor seating. Walkable to everything in Fishtown too. Good value for east coast remote work.',
    latitude: 39.9660,
    longitude: -75.1413,
  },
  {
    id: deterministicUuid(12003),
    name: 'Rittenhouse Square',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19103',
    description:
      'The park is the centerpiece and it works. Surrounded by cafes, restaurants, and walkable blocks in every direction. Most expensive neighborhood in Philly but still cheaper than Manhattan. Reliable wifi.',
    latitude: 39.9496,
    longitude: -75.1718,
  },
];

// ---------------------------------------------------------------------------
// USERS (10 total, including admin)
// ---------------------------------------------------------------------------
interface UserSeed {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: Date;
}

const users: UserSeed[] = [
  {
    id: deterministicUuid(50001),
    email: 'admin@nomadhood.com',
    name: 'Admin User',
    isAdmin: true,
    createdAt: daysAgo(180),
  },
  {
    id: deterministicUuid(50002),
    email: 'sarah@example.com',
    name: 'Sarah Chen',
    isAdmin: false,
    createdAt: daysAgo(170),
  },
  {
    id: deterministicUuid(50003),
    email: 'marcus@example.com',
    name: 'Marcus Johnson',
    isAdmin: false,
    createdAt: daysAgo(155),
  },
  {
    id: deterministicUuid(50004),
    email: 'elena@example.com',
    name: 'Elena Rodriguez',
    isAdmin: false,
    createdAt: daysAgo(140),
  },
  {
    id: deterministicUuid(50005),
    email: 'james@example.com',
    name: 'James Okafor',
    isAdmin: false,
    createdAt: daysAgo(120),
  },
  {
    id: deterministicUuid(50006),
    email: 'priya@example.com',
    name: 'Priya Sharma',
    isAdmin: false,
    createdAt: daysAgo(100),
  },
  {
    id: deterministicUuid(50007),
    email: 'tom@example.com',
    name: 'Tom Lindqvist',
    isAdmin: false,
    createdAt: daysAgo(85),
  },
  {
    id: deterministicUuid(50008),
    email: 'ana@example.com',
    name: 'Ana Petrova',
    isAdmin: false,
    createdAt: daysAgo(60),
  },
  {
    id: deterministicUuid(50009),
    email: 'derek@example.com',
    name: 'Derek Kim',
    isAdmin: false,
    createdAt: daysAgo(45),
  },
  {
    id: deterministicUuid(50010),
    email: 'rachel@example.com',
    name: 'Rachel Nguyen',
    isAdmin: false,
    createdAt: daysAgo(20),
  },
];

// ---------------------------------------------------------------------------
// REVIEW COMMENT POOL (30 comments, some null for rating-only)
// ---------------------------------------------------------------------------
const commentPool: (string | null)[] = [
  'Worked from here for three months. Wifi held up, cafes were solid, would come back.',
  'Good bones but the noise at night made sleep tough. Fine for short stays.',
  null,
  'Best cafe-to-rent ratio I have found in a while. Stayed longer than planned.',
  'Walkability is the main selling point. Everything else is average.',
  'Internet was fast everywhere I tried. The coworking space nearby was a bonus.',
  null,
  'Felt safe walking around at all hours. That matters more than people think.',
  'Overpriced for what you get. The hype outpaces the reality.',
  'Quiet during the day, which is exactly what I need. Good focus environment.',
  null,
  'Food options were excellent and affordable. Cooked maybe twice in two months.',
  'Transit access saved me from needing a car. That alone is worth the rent premium.',
  'Stayed six weeks. No complaints. Nothing amazing either. Solid baseline.',
  null,
  'The park nearby was crucial for my sanity. Greenspace is underrated for productivity.',
  'Nightlife was there when I wanted it, easy to avoid when I did not.',
  'Found three cafes within walking distance that never kicked me out. That is the metric.',
  null,
  'Grocery stores within walking distance made daily life easy. Small thing, big impact.',
  'Met other remote workers organically. Good community without forced networking events.',
  'The neighborhood felt genuinely lived-in, not a tourist zone. That matters for longer stays.',
  null,
  'Air quality was noticeably better than downtown. My allergies appreciated it.',
  'Laundromats and essentials all walkable. The basics were covered.',
  'Noise from construction was constant during my stay. Check for active projects before committing.',
  null,
  'Perfect for a one-month test. Long enough to get a routine, short enough to not get bored.',
  'The local library had fast wifi and quiet rooms. Free coworking if you are on a budget.',
  'Bike infrastructure was excellent. Saved money on transit and got exercise. Win-win.',
];

// ---------------------------------------------------------------------------
// MAIN SEED FUNCTION
// ---------------------------------------------------------------------------
async function main() {
  console.log('Starting database seed...');

  // --- Clean up old sample neighborhoods from previous seed ---
  await prisma.neighborhood.deleteMany({
    where: {
      id: {
        startsWith: 'sample-neighborhood-',
      },
    },
  });

  // --- Seed neighborhoods ---
  for (const n of neighborhoods) {
    await prisma.neighborhood.upsert({
      where: { id: n.id },
      update: {
        name: n.name,
        city: n.city,
        state: n.state,
        zip: n.zip,
        description: n.description,
        latitude: n.latitude,
        longitude: n.longitude,
      },
      create: n,
    });
  }
  console.log(`Seeded ${neighborhoods.length} neighborhoods`);

  // --- Seed users ---
  // Collect actual DB records so we use the real IDs (handles pre-existing users)
  const dbUsers: { id: string; email: string }[] = [];
  for (const u of users) {
    const dbUser = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, isAdmin: u.isAdmin },
      create: u,
    });
    dbUsers.push({ id: dbUser.id, email: dbUser.email });
  }
  console.log(`Seeded ${dbUsers.length} users`);

  // --- Clear existing reviews and favorites for a clean re-seed ---
  await prisma.favorite.deleteMany({});
  await prisma.review.deleteMany({});
  console.log('Cleared existing reviews and favorites');

  // --- Build review data ---
  const rng = createRng(99999);
  const reviewData: {
    rating: number;
    comment: string | null;
    userId: string;
    neighborhoodId: string;
    createdAt: Date;
  }[] = [];

  // Track user-neighborhood pairs to avoid duplicates
  const reviewPairs = new Set<string>();

  for (let ni = 0; ni < neighborhoods.length; ni++) {
    const hood = neighborhoods[ni];
    const numReviewers = rng.int(3, 8);
    const reviewers = rng.pick(dbUsers, numReviewers);

    for (let ri = 0; ri < reviewers.length; ri++) {
      const user = reviewers[ri];
      const pairKey = `${user.id}:${hood.id}`;

      // Skip if this user already reviewed this neighborhood
      if (reviewPairs.has(pairKey)) {
        // Consume the RNG values to keep sequence stable
        rng.next(); // ratingRoll
        rng.int(0, commentPool.length - 1); // commentIdx
        rng.int(1, 180); // reviewDaysAgo
        continue;
      }
      reviewPairs.add(pairKey);

      const ratingRoll = rng.next();
      let rating: number;
      if (ratingRoll < 0.15) {
        rating = 3;
      } else if (ratingRoll < 0.65) {
        rating = 4;
      } else {
        rating = 5;
      }

      const commentIdx = rng.int(0, commentPool.length - 1);
      const comment = commentPool[commentIdx];
      const reviewDaysAgo = rng.int(1, 180);

      reviewData.push({
        rating,
        comment: comment ?? null,
        userId: user.id,
        neighborhoodId: hood.id,
        createdAt: daysAgo(reviewDaysAgo),
      });
    }
  }

  await prisma.review.createMany({ data: reviewData });
  console.log(`Seeded ${reviewData.length} reviews`);

  // --- Build favorite data ---
  const favRng = createRng(77777);
  const favData: {
    position: number;
    userId: string;
    neighborhoodId: string;
  }[] = [];

  const favPairs = new Set<string>();

  for (const user of dbUsers) {
    const numFavs = favRng.int(5, 12);
    const favHoods = favRng.pick(neighborhoods, numFavs);
    let pos = 0;

    for (let fi = 0; fi < favHoods.length; fi++) {
      const hood = favHoods[fi];
      const pairKey = `${user.id}:${hood.id}`;
      if (favPairs.has(pairKey)) continue;
      favPairs.add(pairKey);

      favData.push({
        position: pos++,
        userId: user.id,
        neighborhoodId: hood.id,
      });
    }
  }

  await prisma.favorite.createMany({ data: favData });
  console.log(`Seeded ${favData.length} favorites`);

  console.log('Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
