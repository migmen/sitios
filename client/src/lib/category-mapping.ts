import React from "react";
import { Emoji } from "react-apple-emojis";

// Comprehensive emoji mapping for categories and subcategories
export const CATEGORY_EMOJIS = {
  // Main categories
  'Restaurant': '🍽️',
  'Cafe': '☕',
  'Coffee': '☕',
  'Bar': '🍺',
  'Museum': '🎨',
  'Bookstore': '📚',
  'Market': '🛒',
  'Park': '🌳',
  'Shop': '🛍️',
  'Hotel': '🏨',
  'Theater': '🎭',
  'Gallery': '🖼️',
  'Library': '📚',
  'Gym': '💪',
  'Spa': '🧘',
  'Bakery': '🥖',
  'Other': '📍',

  // Restaurant subcategories
  'Italian': '🍝',
  'Japanese': '🍣',
  'Sushi': '🍣',
  'Chinese': '🥡',
  'Mexican': '🌮',
  'Thai': '🍜',
  'Indian': '🍛',
  'French': '🥐',
  'American': '🍔',
  'Mediterranean': '🫒',
  'Korean': '🍲',
  'Vietnamese': '🍜',
  'Pizza': '🍕',
  'Seafood': '🦞',
  'Steakhouse': '🥩',
  'Vegetarian': '🥗',
  'Vegan': '🌱',
  'BBQ': '🍖',
  'Fine Dining': '🍾',
  'Casual Dining': '🍽️',
  'Fast Food': '🍟',

  // Coffee/Cafe subcategories
  'Specialty Coffee': '☕',
  'Roastery': '☕',
  'Tea House': '🍵',
  'Bubble Tea': '🧋',
  'Pastries': '🥐',
  'Breakfast': '🥞',
  'Brunch': '🥐',

  // Bar subcategories
  'Cocktail Bar': '🍸',
  'Wine Bar': '🍷',
  'Sports Bar': '🍺',
  'Brewery': '🍺',
  'Pub': '🍻',
  'Rooftop': '🏙️',
  'Dive Bar': '🍺',

  // Shopping subcategories
  'Clothing': '👕',
  'Books': '📖',
  'Electronics': '📱',
  'Furniture': '🪑',
  'Art': '🎨',
  'Vintage': '👘',
  'Jewelry': '💎',
  'Groceries': '🥬',
  'Farmers Market': '🍎',
  'Antiques': '🏺',

  // Entertainment subcategories
  'Movie Theater': '🎬',
  'Concert Hall': '🎵',
  'Comedy Club': '😂',
  'Dance Club': '💃',
  'Live Music': '🎸',
  'Art Gallery': '🖼️',
  'Science Museum': '🔬',
  'History Museum': '🏛️',
  'Modern Art': '🎨',

  // Outdoor/Recreation
  'Beach': '🏖️',
  'Hiking': '🥾',
  'Garden': '🌺',
  'Playground': '🛝',
  'Sports': '⚽',
  'Marina': '⛵',
  'Viewpoint': '🏔️',

  // Health & Wellness
  'Yoga': '🧘‍♀️',
  'Massage': '💆',
  'Fitness': '🏋️',
  'Medical': '🏥',
  'Pharmacy': '💊',

  // Services
  'Salon': '💇',
  'Bank': '🏦',
  'Post Office': '📮',
  'Gas Station': '⛽',
  'Parking': '🅿️',
  'Car Rental': '🚗',

  // Transportation
  'Airport': '✈️',
  'Train Station': '🚂',
  'Bus Stop': '🚌',
  'Taxi': '🚕',
  'Metro': '🚇',
} as const;

// Map emoji strings to react-apple-emojis names
const EMOJI_NAME_MAP: Record<string, string> = {
  '🍽️': 'fork-and-knife',
  '☕': 'hot-beverage',
  '🍺': 'beer-mug',
  '🎨': 'artist-palette',
  '📚': 'books',
  '🛒': 'shopping-cart',
  '🌳': 'deciduous-tree',
  '🛍️': 'shopping-bags',
  '🏨': 'hotel',
  '🎭': 'performing-arts',
  '🖼️': 'framed-picture',
  '💪': 'flexed-biceps',
  '🧘': 'person-in-lotus-position',
  '🥖': 'baguette-bread',
  '📍': 'round-pushpin',
  '🍝': 'spaghetti',
  '🍣': 'sushi',
  '🥡': 'takeout-box',
  '🌮': 'taco',
  '🍜': 'steaming-bowl',
  '🍛': 'curry-rice',
  '🥐': 'croissant',
  '🍔': 'hamburger',
  '🫒': 'olive',
  '🍲': 'pot-of-food',
  '🍕': 'pizza',
  '🦞': 'lobster',
  '🥩': 'cut-of-meat',
  '🥗': 'green-salad',
  '🌱': 'seedling',
  '🍖': 'meat-on-bone',
  '🍾': 'bottle-with-popping-cork',
  '🍟': 'french-fries',
  '🍵': 'teacup-without-handle',
  '🧋': 'bubble-tea',
  '🥞': 'pancakes',
  '🍸': 'cocktail-glass',
  '🍷': 'wine-glass',
  '🍻': 'clinking-beer-mugs',
  '🏙️': 'cityscape',
  '👕': 't-shirt',
  '📖': 'open-book',
  '📱': 'mobile-phone',
  '🪑': 'chair',
  '👘': 'kimono',
  '💎': 'gem-stone',
  '🥬': 'leafy-greens',
  '🍎': 'red-apple',
  '🏺': 'amphora',
  '🎬': 'movie-camera',
  '🎵': 'musical-note',
  '😂': 'face-with-tears-of-joy',
  '💃': 'woman-dancing',
  '🎸': 'guitar',
  '🔬': 'microscope',
  '🏛️': 'classical-building',
  '🏖️': 'beach-with-umbrella',
  '🥾': 'hiking-boot',
  '🌺': 'hibiscus',
  '🛝': 'playground-slide',
  '⚽': 'soccer-ball',
  '⛵': 'sailboat',
  '🏔️': 'snow-capped-mountain',
  '🧘‍♀️': 'woman-in-lotus-position',
  '💆': 'person-getting-massage',
  '🏋️': 'person-lifting-weights',
  '🏥': 'hospital',
  '💊': 'pill',
  '💇': 'person-getting-haircut',
  '🏦': 'bank',
  '📮': 'postbox',
  '⛽': 'fuel-pump',
  '🅿️': 'p-button',
  '🚗': 'automobile',
  '✈️': 'airplane',
  '🚂': 'locomotive',
  '🚌': 'bus',
  '🚕': 'taxi',
  '🚇': 'metro'
};

export function getCategoryEmoji(category: string, subtype?: string): string {
  // First try subtype if provided
  if (subtype && CATEGORY_EMOJIS[subtype as keyof typeof CATEGORY_EMOJIS]) {
    return CATEGORY_EMOJIS[subtype as keyof typeof CATEGORY_EMOJIS];
  }
  
  // Then try main category
  if (CATEGORY_EMOJIS[category as keyof typeof CATEGORY_EMOJIS]) {
    return CATEGORY_EMOJIS[category as keyof typeof CATEGORY_EMOJIS];
  }
  
  // Default fallback
  return '📍';
}

export function getCategoryEmojiName(category: string, subtype?: string): string {
  const emojiString = getCategoryEmoji(category, subtype);
  return EMOJI_NAME_MAP[emojiString] || 'round-pushpin';
}

export function CategoryEmoji({ category, subtype, className, ...props }: { 
  category: string; 
  subtype?: string; 
  className?: string;
  [key: string]: any;
}) {
  const emojiName = getCategoryEmojiName(category, subtype);
  return React.createElement(Emoji, { name: emojiName, className, ...props });
}

export function getAllCategories(locations: Array<{ type: string; subtype: string }>): Array<{ 
  name: string; 
  emoji: string; 
  count: number; 
  isSubcategory?: boolean;
  parentCategory?: string;
}> {
  const categoryMap = new Map<string, { count: number; isSubcategory: boolean; parentCategory?: string }>();
  
  locations.forEach(location => {
    const mainType = location.type;
    const subType = location.subtype;
    
    // Add main category
    const mainKey = mainType;
    if (categoryMap.has(mainKey)) {
      categoryMap.get(mainKey)!.count++;
    } else {
      categoryMap.set(mainKey, { count: 1, isSubcategory: false });
    }
    
    // Add subcategory if it exists and is different from main category
    if (subType && subType.trim() && subType !== mainType) {
      const subKey = subType;
      if (categoryMap.has(subKey)) {
        categoryMap.get(subKey)!.count++;
      } else {
        categoryMap.set(subKey, { count: 1, isSubcategory: true, parentCategory: mainType });
      }
    }
  });
  
  return Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      name,
      emoji: getCategoryEmoji(data.parentCategory || name, data.isSubcategory ? name : undefined),
      count: data.count,
      isSubcategory: data.isSubcategory,
      parentCategory: data.parentCategory,
    }))
    .sort((a, b) => {
      // Sort main categories first, then subcategories, then by count
      if (a.isSubcategory !== b.isSubcategory) {
        return a.isSubcategory ? 1 : -1;
      }
      return b.count - a.count;
    });
}