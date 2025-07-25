import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, findDatabaseByTitle } from "./notion";

// Environment variables validation
if (!process.env.NOTION_INTEGRATION_SECRET) {
    throw new Error("NOTION_INTEGRATION_SECRET is not defined. Please add it to your environment variables.");
}

// Setup database for SF Spots
async function setupNotionDatabases() {
    await createDatabaseIfNotExists("SF Spots", {
        // Every database needs a Name/Title property
        Name: {
            title: {}
        },
        Description: {
            rich_text: {}
        },
        "Price (1-3)": {
            select: {
                options: [
                    { name: "0", color: "green" }, // Free
                    { name: "1", color: "yellow" }, // $
                    { name: "2", color: "orange" }, // $$
                    { name: "3", color: "red" } // $$$
                ]
            }
        },
        Photo: {
            files: {}
        },
        Address: {
            rich_text: {}
        },
        Type: {
            select: {
                options: [
                    { name: "Cafe", color: "blue" },
                    { name: "Restaurant", color: "green" },
                    { name: "Museum", color: "purple" },
                    { name: "Bookstore", color: "orange" },
                    { name: "Market", color: "pink" },
                    { name: "Park", color: "green" },
                    { name: "Bar", color: "yellow" },
                    { name: "Shop", color: "gray" },
                    { name: "Other", color: "default" }
                ]
            }
        },
        Subtype: {
            rich_text: {}
        },
        "Last Visited": {
            date: {}
        }
    });
}

async function createSampleData() {
    try {
        console.log("Adding sample SF spots...");

        // Find the database
        const spotsDb = await findDatabaseByTitle("SF Spots");

        if (!spotsDb) {
            throw new Error("Could not find the SF Spots database.");
        }

        const spots = [
            {
                name: "Blue Bottle Coffee",
                description: "Artisanal coffee roastery with minimalist aesthetic and exceptional single-origin beans.",
                price: "2",
                address: "66 Mint St, San Francisco, CA 94103",
                type: "Cafe",
                subtype: "Specialty Coffee"
            },
            {
                name: "Tartine Bakery",
                description: "Renowned bakery famous for their sourdough bread, pastries, and seasonal California cuisine.",
                price: "2",
                address: "600 Guerrero St, San Francisco, CA 94110",
                type: "Cafe",
                subtype: "Bakery"
            },
            {
                name: "SFMOMA",
                description: "World-class modern and contemporary art museum featuring rotating exhibitions and permanent collections.",
                price: "3",
                address: "151 3rd St, San Francisco, CA 94103",
                type: "Museum",
                subtype: "Art Museum"
            },
            {
                name: "City Lights Bookstore",
                description: "Historic independent bookstore and publisher, landmark of the Beat Generation literary movement.",
                price: "0",
                address: "261 Columbus Ave, San Francisco, CA 94133",
                type: "Bookstore",
                subtype: "Independent"
            },
            {
                name: "Ferry Building Marketplace",
                description: "Gourmet food hall and farmers market in a beautifully restored historic ferry terminal.",
                price: "2",
                address: "1 Ferry Building, San Francisco, CA 94111",
                type: "Market",
                subtype: "Food Hall"
            },
            {
                name: "Golden Gate Park",
                description: "Massive urban park with gardens, museums, lakes, and recreational facilities.",
                price: "0",
                address: "Golden Gate Park, San Francisco, CA",
                type: "Park",
                subtype: "Urban Park"
            },
            {
                name: "The Fillmore",
                description: "Legendary music venue that helped define the San Francisco sound of the 1960s.",
                price: "3",
                address: "1805 Geary Blvd, San Francisco, CA 94115",
                type: "Bar",
                subtype: "Music Venue"
            },
            {
                name: "Patagonia",
                description: "Outdoor clothing and gear store committed to environmental sustainability.",
                price: "3",
                address: "770 North Point St, San Francisco, CA 94109",
                type: "Shop",
                subtype: "Outdoor Gear"
            }
        ];

        for (let spot of spots) {
            await notion.pages.create({
                parent: {
                    database_id: spotsDb.id
                },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: spot.name
                                }
                            }
                        ]
                    },
                    Description: {
                        rich_text: [
                            {
                                text: {
                                    content: spot.description
                                }
                            }
                        ]
                    },
                    "Price (1-3)": {
                        select: {
                            name: spot.price
                        }
                    },
                    Address: {
                        rich_text: [
                            {
                                text: {
                                    content: spot.address
                                }
                            }
                        ]
                    },
                    Type: {
                        select: {
                            name: spot.type
                        }
                    },
                    Subtype: {
                        rich_text: [
                            {
                                text: {
                                    content: spot.subtype
                                }
                            }
                        ]
                    }
                }
            });

            console.log(`Created spot: ${spot.name}`);
        }

        console.log("Sample data creation complete.");
    } catch (error) {
        console.error("Error creating sample data:", error);
    }
}

// Run the setup
setupNotionDatabases().then(() => {
    return createSampleData();
}).then(() => {
    console.log("Setup complete!");
    process.exit(0);
}).catch(error => {
    console.error("Setup failed:", error);
    process.exit(1);
});