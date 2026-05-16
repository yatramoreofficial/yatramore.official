// ============================================
// JOURNEY DATA — YatrAmore
// ============================================
// To add a new trip, copy one of the objects below and fill in your details.
// The card will automatically appear on the "Our Journey" page.
//
// Fields:
//   category  — Must match a filter button: "Italy", "India", "Europe", "Asia", "Oceania"
//   badge     — "Must Visit", "Our Favourite", "Hidden Gem", "Gem Explored" (or leave empty "")
//   badgeType — "default" (brown), "love" (pink), "gem" (dark brown), or "" for default
//   location  — The subtitle shown below the image (e.g. "Venice, Italy")
//   title     — The card heading
//   description — A short description of your experience
//   image     — Path to photo file (e.g. "photos/venice.jpg") or "Images/logo.svg" as placeholder
//   date      — When you visited (e.g. "April 2025")
//   nights    — Number of nights (e.g. "1" or "4")
//   rating    — Your rating (e.g. "5/5")
//   tags      — Array of emoji tags (e.g. ["🏛️ History", "🍕 Food"])
// ============================================

const JOURNEY_DATA = [
    {
        category: "Italy",
        badge: "Must Visit",
        badgeType: "default",
        location: "Venice, Italy",
        title: "Venice City",
        description: "A wonderful blend of canals, gondolas, historic architecture, and vibrant culture, where San Marco Square, delicious food, and historic places make every moment feel magical and memorable.",
        image: "Images/Venice.webp",
        date: "April 2025",
        nights: "1",
        rating: "5/5",
        tags: ["🏛️ History", "🍕 Food", "📸 Photography"]
    },
    {
        category: "Europe",
        badge: "Our Favourite",
        badgeType: "love",
        location: "Crete, Greece",
        title: "Heraklion, Matala, Elafonissi, Chania",
        description: "Crete is a stunning island where turquoise beaches, historic towns, and relaxed charm come together beautifully, creating unforgettable moments by the sea.",
        image: "Images/Crete.webp",
        date: "July 2025",
        nights: "6",
        rating: "5/5",
        tags: ["🏖️ Beach", "🍺 Local Life", "📸 Panoramic"]
    },
    {
        category: "Italy",
        badge: "Must Visit",
        badgeType: "default",
        location: "Trentino-Alto Adige, Italy",
        title: "Folgaria",
        description: "A beautiful mountain destination where ski slopes, local food, and unspoiled nature come together to create a relaxing and memorable stay",
        image: "Images/Folgaria.webp",
        date: "January 2025",
        nights: "4",
        rating: "5/5",
        tags: ["🏔️ Nature", "⛷️ 🏂 Sports", "🍽️ Food"]
    },
    {
        category: "Italy",
        badge: "Must Visit",
        badgeType: "default",
        location: "Trentino-South Tyrol, Italy",
        title: "Bolzano & Naturns",
        description: "A wonderful blend of mountain scenery, scenic hikes, authentic food, and pure nature, making every moment feel calm and memorable.",
        image: "Images/Naturns.webp",
        date: "April 2025",
        nights: "3",
        rating: "4/5",
        tags: ["🏔️ Nature", "🍝 Food", "📸 Panoramic"]
    },
    {
        category: "Italy",
        badge: "Hidden Gem",
        badgeType: "gem",
        location: "Verona, Italy",
        title: "Borgo Stazione Bike Inn",
        description: "A lovely place where history, comfort, and nature blend beautifully, offering a peaceful stay with genuine hospitality and a special bike-friendly spirit.",
        image: "Images/Borgo.webp",
        date: "September 2025",
        nights: "2 nights",
        rating: "5/5",
        tags: ["🚴🏻‍♀️ Sports", "🧖🏻‍♀️ Wellness", "🍝 Food"]
    },
    {
        category: "Italy",
        badge: "Must Visit",
        badgeType: "default",
        location: "Turin, Italy",
        title: "Turin City",
        description: "A vibrant city where great food, rich history, and elegant city-centre landmarks come together, with highlights like the Egyptian Museum adding a truly memorable cultural touch.",
        image: "Images/Torino.webp",
        date: "April 2025",
        nights: "3",
        rating: "5/5",
        tags: ["🏛️ History", "🍝 Food", "📸 Photography"]
    },
    {
        category: "Italy",
        badge: "Our Favourite",
        badgeType: "love",
        location: "Aosta Valley, Italy",
        title: "Courmayeur",
        description: "A breathtaking alpine experience, combining the spectacular Skyway ascent, the beauty of the Aosta Valley, and the unique infinity table at Punta Helbronner create an unforgettable experience.",
        image: "Images/Monte Bianco.webp",
        date: "November 2024",
        nights: "4",
        rating: "5/5",
        tags: ["🏔️ Nature", "🍺 Local Life", "📸 Panoramic"]
    },
    {
        category: "Italy",
        badge: "Hidden Gem",
        badgeType: "gem",
        location: "Peio, Italy",
        title: "National Park of Stelvio & Adamello Brenta",
        description: "A lovely mountain escape where alpine beauty and peaceful charm shine, surrounded by the wonders of Stelvio and Adamello Brenta.",
        image: "Images/Pieo.webp",
        date: "April 2025",
        nights: "4",
        rating: "5/5",
        tags: ["🏔️ Nature", "🥩 Food", "🐻 Wildlife"]
    },
    {
        category: "India",
        badge: "Gem Explored",
        badgeType: "gem",
        location: "Destination, Region",
        title: "Place Name Here",
        description: "Describe your experience here — the culture, the food, the people, the stay. Be as real as you want. Your audience loves authenticity.",
        image: "Images/logo.svg",
        date: "Month Year",
        nights: "X nights",
        rating: "Rating",
        tags: ["🕌 History", "🌶️ Spices", "🛕 Spirituality"]
    },
    {
        category: "Asia",
        badge: "Top Choice",
        badgeType: "gem",
        location: "Destination, Region",
        title: "Place Name Here",
        description: "Describe your experience here — the culture, the food, the people, the stay. Be as real as you want. Your audience loves authenticity.",
        image: "Images/logo.svg",
        date: "Month Year",
        nights: "X nights",
        rating: "Rating",
        tags: ["🕌 History", "🌶️ Spices", "🛕 Spirituality"]
    },
    {
        category: "Oceania",
        badge: "Gem Explored",
        badgeType: "gem",
        location: "Destination, Region",
        title: "Place Name Here",
        description: "Describe your experience here — the culture, the food, the people, the stay. Be as real as you want. Your audience loves authenticity.",
        image: "Images/logo.svg",
        date: "Month Year",
        nights: "X nights",
        rating: "Rating",
        tags: ["🐠 Ocean", "🦤 Wildlife", "🏝️ Beaches"]
    }
];
