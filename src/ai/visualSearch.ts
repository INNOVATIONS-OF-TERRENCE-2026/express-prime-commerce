/**
 * Visual Search Engine with Image Recognition
 * 
 * AI-powered visual search allowing customers to find
 * products by uploading images or using camera.
 * 
 * FEATURES:
 * - Image similarity search
 * - Color extraction
 * - Style detection
 * - Product matching
 * 
 * @module ai/visualSearch
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export type ImageSource = 'upload' | 'camera' | 'url' | 'screenshot';

export type VisualFeature = 
  | 'color'
  | 'shape'
  | 'pattern'
  | 'texture'
  | 'style'
  | 'category';

export interface VisualSearchQuery {
  id: string;
  timestamp: Date;
  source: ImageSource;
  imageUrl?: string;
  imageBase64?: string;
  // Extracted features
  dominantColors: ColorInfo[];
  detectedCategory?: string;
  detectedStyle?: string;
  patterns: string[];
  // Search context
  searchFilters?: {
    category?: string;
    priceRange?: { min: number; max: number };
    colors?: string[];
  };
}

export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  name: string;
  percentage: number;
}

export interface VisualMatch {
  productId: string;
  title: string;
  imageUrl: string;
  price: number;
  // Similarity scores
  overallSimilarity: number;
  colorSimilarity: number;
  shapeSimilarity: number;
  styleSimilarity: number;
  // Match details
  matchedFeatures: VisualFeature[];
  matchedColors: string[];
}

export interface VisualSearchResult {
  queryId: string;
  timestamp: Date;
  // Results
  matches: VisualMatch[];
  totalMatches: number;
  // Analysis
  extractedFeatures: {
    colors: ColorInfo[];
    category: string;
    style: string;
    patterns: string[];
  };
  // Suggestions
  refinementSuggestions: string[];
  relatedSearches: string[];
}

export interface VisualSearchStats {
  totalSearches: number;
  avgMatchScore: number;
  topCategories: Array<{ category: string; count: number }>;
  topColors: Array<{ color: string; count: number }>;
  conversionRate: number;
}

// ============================================================================
// STATE
// ============================================================================

const searchHistory: VisualSearchQuery[] = [];
const searchResults: Map<string, VisualSearchResult> = new Map();

// Color name mapping
const colorNames: Record<string, string> = {
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#FFFFFF': 'White',
  '#000000': 'Black',
  '#FFA500': 'Orange',
  '#800080': 'Purple',
  '#FFC0CB': 'Pink',
  '#A52A2A': 'Brown',
  '#808080': 'Gray',
  '#F5F5DC': 'Beige',
  '#000080': 'Navy',
  '#008080': 'Teal',
};

// Style categories
const styleCategories = [
  'minimalist',
  'modern',
  'classic',
  'vintage',
  'bohemian',
  'industrial',
  'rustic',
  'contemporary',
  'luxury',
  'casual',
];

// Product categories
const productCategories = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports',
  'Beauty',
  'Accessories',
  'Furniture',
  'Art',
];

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Perform visual search from an image
 */
export async function visualSearch(
  imageData: string | File,
  source: ImageSource,
  filters?: VisualSearchQuery['searchFilters']
): Promise<VisualSearchResult> {
  const queryId = `vsearch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Convert image to analyzable format
  const imageUrl = typeof imageData === 'string' 
    ? imageData 
    : URL.createObjectURL(imageData);
  
  // Extract visual features
  const colors = await extractColors(imageUrl);
  const category = detectCategory(imageUrl);
  const style = detectStyle(colors);
  const patterns = detectPatterns(imageUrl);
  
  // Create search query
  const query: VisualSearchQuery = {
    id: queryId,
    timestamp: new Date(),
    source,
    imageUrl,
    dominantColors: colors,
    detectedCategory: category,
    detectedStyle: style,
    patterns,
    searchFilters: filters,
  };
  
  searchHistory.push(query);
  
  // Find matching products
  const matches = await findVisualMatches(query);
  
  // Generate result
  const result: VisualSearchResult = {
    queryId,
    timestamp: new Date(),
    matches: matches.slice(0, 20),
    totalMatches: matches.length,
    extractedFeatures: {
      colors,
      category,
      style,
      patterns,
    },
    refinementSuggestions: generateRefinementSuggestions(colors, category),
    relatedSearches: generateRelatedSearches(category, style),
  };
  
  searchResults.set(queryId, result);
  return result;
}

/**
 * Search by color
 */
export async function searchByColor(colorHex: string): Promise<VisualMatch[]> {
  const matches = generateMockMatches(10);
  
  // Sort by color similarity
  return matches.map(m => ({
    ...m,
    colorSimilarity: calculateColorSimilarity(colorHex, m.matchedColors[0] || '#FFFFFF'),
  })).sort((a, b) => b.colorSimilarity - a.colorSimilarity);
}

/**
 * Search similar products
 */
export async function findSimilarProducts(productId: string): Promise<VisualMatch[]> {
  // In production, would use product's image features
  return generateMockMatches(8).map(m => ({
    ...m,
    overallSimilarity: 0.7 + Math.random() * 0.25,
  })).sort((a, b) => b.overallSimilarity - a.overallSimilarity);
}

/**
 * Extract dominant colors from image
 */
async function extractColors(imageUrl: string): Promise<ColorInfo[]> {
  // In production, would use Canvas API or image processing library
  // Mock implementation returns random colors
  const mockColors: ColorInfo[] = [
    { hex: '#2C3E50', rgb: { r: 44, g: 62, b: 80 }, name: 'Dark Blue Gray', percentage: 35 },
    { hex: '#E74C3C', rgb: { r: 231, g: 76, b: 60 }, name: 'Red', percentage: 25 },
    { hex: '#ECF0F1', rgb: { r: 236, g: 240, b: 241 }, name: 'Light Gray', percentage: 20 },
    { hex: '#3498DB', rgb: { r: 52, g: 152, b: 219 }, name: 'Blue', percentage: 15 },
    { hex: '#2ECC71', rgb: { r: 46, g: 204, b: 113 }, name: 'Green', percentage: 5 },
  ];
  
  return mockColors;
}

/**
 * Detect product category from image
 */
function detectCategory(imageUrl: string): string {
  // In production, would use ML model
  return productCategories[Math.floor(Math.random() * productCategories.length)];
}

/**
 * Detect style from colors and patterns
 */
function detectStyle(colors: ColorInfo[]): string {
  // Simple heuristic based on colors
  const dominantColor = colors[0];
  
  if (dominantColor.percentage > 50) {
    if (isNeutralColor(dominantColor.hex)) {
      return 'minimalist';
    }
  }
  
  if (colors.length >= 4) {
    return 'bohemian';
  }
  
  return styleCategories[Math.floor(Math.random() * styleCategories.length)];
}

/**
 * Detect patterns in image
 */
function detectPatterns(imageUrl: string): string[] {
  // In production, would use pattern recognition
  const allPatterns = ['solid', 'striped', 'geometric', 'floral', 'abstract', 'checkered', 'dotted'];
  const numPatterns = Math.floor(Math.random() * 2) + 1;
  
  return allPatterns.slice(0, numPatterns);
}

/**
 * Find products matching visual query
 */
async function findVisualMatches(query: VisualSearchQuery): Promise<VisualMatch[]> {
  // In production, would query vector database
  return generateMockMatches(15);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateColorSimilarity(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  // Calculate Euclidean distance in RGB space
  const distance = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
  
  // Normalize to 0-1 range (max distance is ~441)
  return 1 - (distance / 441.67);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function isNeutralColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  // Check if color is close to grayscale
  const avg = (rgb.r + rgb.g + rgb.b) / 3;
  const deviation = Math.abs(rgb.r - avg) + Math.abs(rgb.g - avg) + Math.abs(rgb.b - avg);
  
  return deviation < 30;
}

function getColorName(hex: string): string {
  // Find closest named color
  const rgb = hexToRgb(hex);
  if (!rgb) return 'Unknown';
  
  let closestName = 'Unknown';
  let closestDistance = Infinity;
  
  for (const [namedHex, name] of Object.entries(colorNames)) {
    const namedRgb = hexToRgb(namedHex);
    if (!namedRgb) continue;
    
    const distance = Math.sqrt(
      Math.pow(rgb.r - namedRgb.r, 2) +
      Math.pow(rgb.g - namedRgb.g, 2) +
      Math.pow(rgb.b - namedRgb.b, 2)
    );
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestName = name;
    }
  }
  
  return closestName;
}

function generateRefinementSuggestions(colors: ColorInfo[], category: string): string[] {
  const suggestions: string[] = [];
  
  // Color-based suggestions
  if (colors.length > 0) {
    suggestions.push(`Show only ${colors[0].name} items`);
    if (colors.length > 1) {
      suggestions.push(`Filter by ${colors[1].name} accent`);
    }
  }
  
  // Category suggestions
  suggestions.push(`Browse all ${category}`);
  suggestions.push(`Similar styles in ${category}`);
  
  return suggestions;
}

function generateRelatedSearches(category: string, style: string): string[] {
  return [
    `${style} ${category.toLowerCase()}`,
    `trending ${category.toLowerCase()}`,
    `best ${category.toLowerCase()} deals`,
    `new ${category.toLowerCase()} arrivals`,
    `${style} home decor`,
  ];
}

function generateMockMatches(count: number): VisualMatch[] {
  const products = [
    { title: 'Modern Minimalist Lamp', price: 89.99 },
    { title: 'Vintage Leather Bag', price: 149.99 },
    { title: 'Abstract Art Print', price: 59.99 },
    { title: 'Geometric Throw Pillow', price: 34.99 },
    { title: 'Industrial Coffee Table', price: 299.99 },
    { title: 'Bohemian Wall Tapestry', price: 45.99 },
    { title: 'Contemporary Vase Set', price: 79.99 },
    { title: 'Classic Watch', price: 199.99 },
    { title: 'Designer Sunglasses', price: 129.99 },
    { title: 'Luxury Candle Set', price: 54.99 },
    { title: 'Artisan Pottery Bowl', price: 69.99 },
    { title: 'Handwoven Basket', price: 39.99 },
    { title: 'Modern Desk Organizer', price: 49.99 },
    { title: 'Vintage Clock', price: 89.99 },
    { title: 'Designer Throw Blanket', price: 119.99 },
  ];
  
  const features: VisualFeature[] = ['color', 'shape', 'pattern', 'texture', 'style'];
  const colors = Object.keys(colorNames);
  
  return products.slice(0, count).map((p, i) => ({
    productId: `prod-visual-${i}`,
    title: p.title,
    imageUrl: `https://via.placeholder.com/300x300?text=${encodeURIComponent(p.title)}`,
    price: p.price,
    overallSimilarity: 0.95 - (i * 0.03),
    colorSimilarity: 0.9 - (i * 0.02),
    shapeSimilarity: 0.85 - (i * 0.03),
    styleSimilarity: 0.88 - (i * 0.025),
    matchedFeatures: features.slice(0, Math.floor(Math.random() * 3) + 2),
    matchedColors: [colors[i % colors.length], colors[(i + 3) % colors.length]],
  }));
}

// ============================================================================
// STATISTICS
// ============================================================================

export function getVisualSearchStats(): VisualSearchStats {
  const results = Array.from(searchResults.values());
  
  if (results.length === 0) {
    return {
      totalSearches: 0,
      avgMatchScore: 0,
      topCategories: [],
      topColors: [],
      conversionRate: 0,
    };
  }
  
  // Calculate average match score
  const allMatches = results.flatMap(r => r.matches);
  const avgMatchScore = allMatches.reduce((sum, m) => sum + m.overallSimilarity, 0) / allMatches.length;
  
  // Count categories
  const categoryCounts = new Map<string, number>();
  results.forEach(r => {
    const cat = r.extractedFeatures.category;
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });
  
  const topCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Count colors
  const colorCounts = new Map<string, number>();
  results.forEach(r => {
    r.extractedFeatures.colors.forEach(c => {
      colorCounts.set(c.name, (colorCounts.get(c.name) || 0) + 1);
    });
  });
  
  const topColors = Array.from(colorCounts.entries())
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    totalSearches: searchHistory.length,
    avgMatchScore,
    topCategories,
    topColors,
    conversionRate: 0.08, // Mock - would calculate from actual conversions
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockVisualSearchData(): {
  recentSearches: VisualSearchQuery[];
  results: VisualSearchResult[];
  stats: VisualSearchStats;
} {
  // Generate mock searches
  const sources: ImageSource[] = ['upload', 'camera', 'url'];
  
  for (let i = 0; i < 10; i++) {
    const colors: ColorInfo[] = [
      {
        hex: Object.keys(colorNames)[i % Object.keys(colorNames).length],
        rgb: { r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255) },
        name: Object.values(colorNames)[i % Object.values(colorNames).length],
        percentage: 40 + Math.floor(Math.random() * 30),
      },
    ];
    
    const query: VisualSearchQuery = {
      id: `vsearch-mock-${i}`,
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
      source: sources[i % sources.length],
      imageUrl: `https://via.placeholder.com/300x300?text=Search${i}`,
      dominantColors: colors,
      detectedCategory: productCategories[i % productCategories.length],
      detectedStyle: styleCategories[i % styleCategories.length],
      patterns: ['solid'],
    };
    
    searchHistory.push(query);
    
    // Generate result
    const result: VisualSearchResult = {
      queryId: query.id,
      timestamp: query.timestamp,
      matches: generateMockMatches(8),
      totalMatches: Math.floor(Math.random() * 50) + 10,
      extractedFeatures: {
        colors,
        category: query.detectedCategory!,
        style: query.detectedStyle!,
        patterns: query.patterns,
      },
      refinementSuggestions: ['Filter by price', 'Show similar colors'],
      relatedSearches: ['modern furniture', 'trending decor'],
    };
    
    searchResults.set(query.id, result);
  }
  
  return {
    recentSearches: searchHistory.slice(-10),
    results: Array.from(searchResults.values()),
    stats: getVisualSearchStats(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core functions
  visualSearch,
  searchByColor,
  findSimilarProducts,
  // Stats
  getVisualSearchStats,
  // Mock
  generateMockVisualSearchData,
};
