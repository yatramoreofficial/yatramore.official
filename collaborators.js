const COLLABORATOR_DATA = [
    {
        "id": "partner-6",
        "category": "Italy",
        "title": "Yoghi Zero",
        "location": "Calabria, Italy",
        "description": "What an innovative team! They perfectly blend advanced scientific research with traditional Italian oenology, allowing us to enjoy the authentic sensory profile of fine wine with 0.0% alcohol. A truly elegant & mindful addition to our journey.",
        "image": "Images/yoghizero.webp",
        "date": "June 2026",
        "Product": "0.0% Alcohol",
        "rating": "5/5",
        "tags": [
            "🍾 Bollicine",
            "🥂 Bianco",
            "🍷 Rosso"
        ],
        "status": "Partner",
        "isCollaborator": true,
        "weblink": "https://yoghizero.com/"
    },
    {
        "id": "partner-5",
        "category": "Oceania",
        "title": "House of Khalsa ☬",
        "location": "Melbourne, Australia",
        "description": "Heritage-inspired watches & refined perfumes crafted with meaning & style. Elegant details, thoughtful design, & a distinctive identity make each piece feel truly special. <br><strong>Discount code: KHALSA5</strong>",
        "image": "Images/Khalsa.webp",
        "date": "May 2026",
        "Gift": "2 X ⌚️+⚱️",
        "rating": "5/5",
        "tags": [
            "🎁 Luxury",
            "☬ Khanda",
            "👳🏾‍♂️ Sikh"
        ],
        "status": "Partner",
        "isCollaborator": true,
        "weblink": "https://houseofkhalsa.com/yatramore/"
    },
    {
        "id": "partner-4",
        "category": "Italy",
        "title": "Gandhi - Ristorante Indiano",
        "location": "Padova, Italy",
        "description": "Authentic Indian dining experience with dishes prepared using traditional recipes. Friendly, attentive staff create a warm & welcoming atmosphere. Rich flavours & genuine hospitality make every visit memorable",
        "image": "Images/gandhi-dinner.webp",
        "date": "April 2026",
        "Menu": "Dinner",
        "rating": "5/5",
        "tags": [
            "🍽️ Food",
            "🌶️ Spices",
            "🍛 Authentic"
        ],
        "status": "Partner",
        "isCollaborator": true,
        "weblink": "https://www.gandhipadova.it/"
    },
    {
        "id": "partner-3",
        "category": "India",
        "title": "We The Humans of Equality",
        "location": "Instagram",
        "description": "The incredible team reached out and collaborated with us to share our unique journey, beautifully crafting an inspiring reel that celebrates love without borders, highlights the seamless blending of our cultures, & truly moved their community.",
        "image": "Images/Human.webp",
        "date": "September 2025",
        "Collab": "Insta Reel",
        "love": "5/5",
        "tags": [
            "📜 Our Story",
            "🎥 Reel",
            "🎬 Spotlight"
        ],
        "status": "Partner",
        "isCollaborator": true,
        "weblink": "https://www.instagram.com/reel/DPL6yqVj2Sr/?igsh=ams0aXBpZGlxejBj"
    },
    {
        "id": "partner-2",
        "category": "India",
        "title": "Unabashed Emotions",
        "location": "Instagram",
        "description": "Ms. Subhada from Unabashed Emotions reached out to feature our cross-cultural romance, beautifully bringing our special moments to life in a captivating and artistic reel that deeply resonated with their audience.",
        "image": "Images/Unbash.webp",
        "date": "September 2025",
        "Collab": "Reel",
        "love": "5/5",
        "tags": [
            "✨ Cross-Cultural",
            "🎬 Spotlight",
            "🎥 Reel"
        ],
        "status": "Partner",
        "isCollaborator": true,
        "weblink": "https://www.instagram.com/reel/DOlq4YCAeEK/?igsh=YmU1Z25uMnAwem4x"
    },
    {
        "id": "partner-1",
        "category": "Europe",
        "title": "Ourcolourfully",
        "location": "Instagram",
        "description": "A heartfelt collaboration with Lora from Ourcolourfully. She reached out to share our Indo-Italian journey with her audience, crafting a beautiful reel that narrates our love story & celebrates blending two distinct cultures into one shared adventure.",
        "image": "Images/Ours.webp",
        "date": "June 2025",
        "Collab": "Story Feature",
        "love": "5/5",
        "tags": [
            "💛 YatrAmore",
            "📜 Our Story",
            "🎥 Reel"
        ],
        "status": "Partner",
        "isCollaborator": true,
        "weblink": "https://www.instagram.com/reel/DKcghubo0eU/"
    }
    /* 
    // --- Placeholder Collaborators (Inactive) ---
    // Uncomment these when you're ready to showcase more partnerships!
    ,
    {
        "id": "partner-2",
        "category": "Oceania",
        "title": "House of Khalsa 🪯",
        "location": "Melbourne, Australia",
        "description": "Heritage-inspired watches and refined perfumes crafted with meaning and style. Elegant details, thoughtful design, and a distinctive identity make each piece feel truly special.",
        "image": "Images/logo.svg",
        "date": "June 2026",
        "Gift": "2 X ⌚️+⚱️",
        "rating": "5/5",
        "tags": [
            "⌚️ Luxury",
            "⚱️ Perfume",
            "👳🏾‍♂️ Heritage"
        ],
        "status": "Partner",
        "isCollaborator": true,

        // 🔗 WEBLINK — Paste the partner's website URL below:
        "weblink": "https://houseofkhalsa.com/"  // <-- ✏️ REPLACE with actual URL
    },
    {
        "id": "partner-3",
        "category": "Italy",
        "title": "Digital Collaborator Name",
        "location": "Place, Country",
        "description": "We are always open to collaborating with brands that share our passion for travel, culture, and authentic storytelling.",
        "image": "Images/logo.svg",
        "date": "Month Year",
        "Camera": "i16 Pro Max",
        "rating": "Rating",
        "tags": [
            "📱 App",
            "🎥 Video",
            "🎬 Activity"
        ],
        "status": "Partner",
        "isCollaborator": true,

        // 🔗 WEBLINK — Paste the partner's website URL below:
        "weblink": "https://example.com"  // <-- ✏️ REPLACE with actual URL
    },
    {
        "id": "partner-4",
        "category": "India",
        "title": "Gusto Autentico Restaurant",
        "location": "Place, Country",
        "description": "Exploration of traditional Roman cuisine through a curated selection of local specialties and authentic flavors.",
        "image": "Images/logo.svg",
        "date": "Month Year",
        "Menu": "Dinner",
        "rating": "Rating",
        "tags": [
            "🍽️ Food",
            "🍷 Local",
            "🍝 Authentic"
        ],
        "status": "Partner",
        "isCollaborator": true,

        // 🔗 WEBLINK — Paste the partner's website URL below:
        "weblink": "https://example.com"  // <-- ✏️ REPLACE with actual URL
    }
    */
];
