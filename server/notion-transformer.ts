// Helper function to transform Notion data with proper price parsing
export function transformNotionLocation(page: any) {
  const properties = page.properties;
  
  // Parse price with comprehensive logic
  let price = 1; // default
  
  // Try different price property names and formats
  if (properties["Price (1-3)"]?.number !== undefined) {
    price = properties["Price (1-3)"].number;
  } else if (properties.Price?.number !== undefined) {
    price = properties.Price.number;
  } else if (properties["Price (1-3)"]?.select?.name) {
    const priceStr = properties["Price (1-3)"].select.name;
    price = parsePriceString(priceStr);
  } else if (properties.Price?.select?.name) {
    const priceStr = properties.Price.select.name;
    price = parsePriceString(priceStr);
  } else if (properties["Cost"]?.select?.name) {
    const priceStr = properties["Cost"].select.name;
    price = parsePriceString(priceStr);
  }
  
  return {
    notionId: page.id,
    name: properties.Name?.title?.[0]?.plain_text || 
          properties.Title?.title?.[0]?.plain_text || 
          "Untitled Location",
    description: properties.Description?.rich_text?.[0]?.plain_text || "",
    price: price,
    photo: properties.Photo?.files?.[0]?.file?.url || 
           properties.Photo?.files?.[0]?.external?.url || null,
    address: properties.Address?.rich_text?.[0]?.plain_text || "",
    type: properties.Type?.select?.name || "Other",
    subtype: properties.Subtype?.select?.name || 
             properties.Subtype?.rich_text?.[0]?.plain_text || "",
    lastVisited: properties["Last Visited"]?.date?.start || 
                properties.LastVisited?.date?.start || null,
  };
}

function parsePriceString(priceStr: string): number {
  if (!priceStr) return 1;
  
  const str = priceStr.toLowerCase().trim();
  
  if (str === "$" || str === "1") return 1;
  if (str === "$$" || str === "2") return 2;
  if (str === "$$$" || str === "3") return 3;
  if (str === "free" || str === "0") return 0;
  
  // Try to parse as number
  const num = parseInt(priceStr);
  if (!isNaN(num) && num >= 0 && num <= 3) return num;
  
  return 1; // default fallback
}