import { ID } from "react-native-appwrite";
import { databases, config } from "./appwrite";
import {
    agentImages,
    galleryImages,
    propertiesImages,
    reviewImages,
} from "./data";

const COLLECTIONS = {
    AGENT: config.agentsCollectionId,
    REVIEWS: config.reviewsCollectionId,
    GALLERY: config.galleriesCollectionId,
    PROPERTY: config.propertiesCollectionId,
};

const propertyTypes = [
    "House",
    "Townhouse",
    "Condo",
    "Duplex",
    "Studio",
    "Villa",
    "Appartment",
    "Other",
];

const facilities = [
    "Laundary",
    "Parking",
    "Gym",
    "Wifi",
    "Pet-friendly",
];

function getRandomSubset<T>(
    array: T[],
    minItems: number,
    maxItems: number
): T[] {
    if (minItems > maxItems) {
        throw new Error("minItems cannot be greater than maxItems");
    }
    if (minItems < 0 || maxItems > array.length) {
        throw new Error(
            "minItems or maxItems are out of valid range for the array"
        );
    }

    const subsetSize =
        Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;

    const arrayCopy = [...array];

    for (let i = arrayCopy.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [arrayCopy[i], arrayCopy[randomIndex]] = [
            arrayCopy[randomIndex],
            arrayCopy[i],
        ];
    }

    return arrayCopy.slice(0, subsetSize);
}

async function seed() {
    try {
        console.log("Starting database seeding...");

        // Clear existing data from all collections
        console.log("\n🗑️  Clearing existing data...");
        for (const key in COLLECTIONS) {
            const collectionId = COLLECTIONS[key as keyof typeof COLLECTIONS];

            if (!collectionId) {
                console.error(`❌ Missing collection ID for ${key}`);
                continue;
            }

            const documents = await databases.listDocuments(
                config.databaseId!,
                collectionId
            );

            for (const doc of documents.documents) {
                await databases.deleteDocument(
                    config.databaseId!,
                    collectionId,
                    doc.$id
                );
            }
        }

        console.log("✅ Cleared all existing data.");

        // Seed Agents FIRST
        console.log("\n👥 Seeding agents...");
        const agents = [];
        for (let i = 1; i <= 5; i++) {
            const agent = await databases.createDocument(
                config.databaseId!,
                COLLECTIONS.AGENT!,
                ID.unique(),
                {
                    name: `Agent ${i}`,
                    email: `agent${i}@example.com`,
                    avatar: agentImages[Math.floor(Math.random() * agentImages.length)],
                }
            );
            agents.push(agent);
        }
        console.log(`✅ Seeded ${agents.length} agents.`);

        // Seed Reviews SECOND (without property reference)
        console.log("\n⭐ Seeding reviews...");
        const reviews = [];
        for (let i = 1; i <= 100; i++) {
            const review = await databases.createDocument(
                config.databaseId!,
                COLLECTIONS.REVIEWS!,
                ID.unique(),
                {
                    name: `Reviewer ${i}`,
                    avatar: reviewImages[Math.floor(Math.random() * reviewImages.length)],
                    review: `This is a review by Reviewer ${i}. Great property!`,
                    rating: Math.floor(Math.random() * 5) + 1,
                }
            );
            reviews.push(review);

            if (i % 20 === 0) {
                console.log(`  ✓ ${i}/100 reviews created`);
            }
        }
        console.log(`✅ Seeded ${reviews.length} reviews.`);

        // Seed Galleries THIRD (without property reference)
        console.log("\n🖼️  Seeding galleries...");
        const galleries = [];
        for (const image of galleryImages) {
            const gallery = await databases.createDocument(
                config.databaseId!,
                COLLECTIONS.GALLERY!,
                ID.unique(),
                { image }
            );
            galleries.push(gallery);
        }
        console.log(`✅ Seeded ${galleries.length} galleries.`);

        // Seed Properties LAST (with relationships)
        console.log("\n🏠 Seeding properties...");
        const properties = [];
        for (let i = 1; i <= 20; i++) {
            const assignedAgent = agents[Math.floor(Math.random() * agents.length)];

            // Get random subsets for relationships
            const maxReviews = Math.min(7, reviews.length);
            const minReviews = Math.min(5, reviews.length);
            const assignedReviews = getRandomSubset(reviews, minReviews, maxReviews);

            const maxGalleries = Math.min(8, galleries.length);
            const minGalleries = Math.min(3, galleries.length);
            const assignedGalleries = getRandomSubset(galleries, minGalleries, maxGalleries);

            const selectedFacilities = facilities
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.floor(Math.random() * facilities.length) + 1);

            const image =
                i < propertiesImages.length
                    ? propertiesImages[i]
                    : propertiesImages[
                        Math.floor(Math.random() * propertiesImages.length)
                        ];

            const property = await databases.createDocument(
                config.databaseId!,
                COLLECTIONS.PROPERTY!,
                ID.unique(),
                {
                    name: `Property ${i}`,
                    type: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
                    description: `This is the description for Property ${i}.`,
                    address: `123 Property Street, City ${i}`,
                    price: Math.floor(Math.random() * 9000) + 1000,
                    area: Math.floor(Math.random() * 3000) + 500,
                    bedrooms: Math.floor(Math.random() * 5) + 1,
                    bathrooms: Math.floor(Math.random() * 5) + 1,
                    rating: Math.floor(Math.random() * 5) + 1,
                    facilities: selectedFacilities,
                    image: image,
                    geolocation: `${(Math.random() * 90).toFixed(6)},${(Math.random() * 180).toFixed(6)}`,
                    agent: assignedAgent.$id,
                    reviews: assignedReviews.map((review) => review.$id),
                    gallery: assignedGalleries.map((gallery) => gallery.$id),
                }
            );

            properties.push(property);
            console.log(`  ✓ Property ${i}/20: ${property.name}`);
        }
        console.log(`✅ Seeded ${properties.length} properties.`);

        console.log("\n🎉 Data seeding completed successfully!");
        console.log(`\nSummary:`);
        console.log(`  - ${agents.length} agents`);
        console.log(`  - ${properties.length} properties`);
        console.log(`  - ${reviews.length} reviews`);
        console.log(`  - ${galleries.length} galleries`);

    } catch (error) {
        console.error("\n❌ Error seeding data:", error);
        if (error instanceof Error) {
            console.error("Error details:", error.message);
        }
        throw error;
    }
}

export default seed;