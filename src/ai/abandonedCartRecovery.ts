/**
 * Abandoned Cart Recovery + Email Marketing Engine
 * 
 * Intelligent cart recovery system that sends personalized
 * emails based on customer behavior, product value, and timing.
 * 
 * RECOVERY SEQUENCE:
 * 1. 1 hour: Gentle reminder
 * 2. 24 hours: Value proposition + social proof
 * 3. 48 hours: Limited time discount
 * 4. 72 hours: Final urgency
 * 
 * @module ai/abandonedCartRecovery
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export type RecoveryEmailType = 
  | 'gentle_reminder'
  | 'value_proposition'
  | 'discount_offer'
  | 'final_urgency'
  | 'back_in_stock'
  | 'price_drop'
  | 'limited_stock';

export type CartStatus = 
  | 'active'
  | 'abandoned'
  | 'recovered'
  | 'converted'
  | 'expired';

export type CustomerSegment =
  | 'new_visitor'
  | 'returning_visitor'
  | 'first_time_buyer'
  | 'repeat_customer'
  | 'vip_customer'
  | 'at_risk';

export interface AbandonedCart {
  id: string;
  sessionId: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  // Cart details
  items: CartItem[];
  subtotal: number;
  estimatedTotal: number;
  currency: string;
  // Timestamps
  createdAt: Date;
  lastActivityAt: Date;
  abandonedAt?: Date;
  recoveredAt?: Date;
  // Status
  status: CartStatus;
  segment: CustomerSegment;
  // Recovery tracking
  emailsSent: number;
  lastEmailSentAt?: Date;
  emailSequence: string[];
  discountApplied?: string;
  discountPercent?: number;
  // Scoring
  recoveryScore: number;
  predictedValue: number;
  urgencyLevel: number;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  compareAtPrice?: number;
  inventoryLevel?: number;
}

export interface RecoveryEmail {
  id: string;
  cartId: string;
  type: RecoveryEmailType;
  // Content
  subject: string;
  preheader: string;
  headline: string;
  bodyText: string;
  ctaText: string;
  ctaUrl: string;
  // Personalization
  customerName?: string;
  productHighlights: CartItem[];
  discountCode?: string;
  discountPercent?: number;
  expiresAt?: Date;
  // Social proof
  socialProof?: SocialProofElement;
  // Tracking
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  convertedAt?: Date;
  // Metrics
  isOpened: boolean;
  isClicked: boolean;
  isConverted: boolean;
}

export interface SocialProofElement {
  type: 'reviews' | 'purchases' | 'viewers' | 'stock';
  text: string;
  count?: number;
}

export interface RecoverySequence {
  id: string;
  name: string;
  steps: RecoveryStep[];
  conditions: SequenceCondition[];
  isActive: boolean;
}

export interface RecoveryStep {
  stepNumber: number;
  delayHours: number;
  emailType: RecoveryEmailType;
  discountPercent?: number;
  includeUrgency: boolean;
  includeSocialProof: boolean;
}

export interface SequenceCondition {
  field: 'cartValue' | 'segment' | 'itemCount' | 'hasAccount';
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains';
  value: string | number | boolean;
}

export interface RecoveryStats {
  totalAbandoned: number;
  totalRecovered: number;
  recoveryRate: number;
  revenueRecovered: number;
  avgCartValue: number;
  // Email metrics
  emailsSent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  // By sequence step
  stepPerformance: Array<{
    step: number;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  }>;
  // By segment
  segmentPerformance: Array<{
    segment: CustomerSegment;
    abandoned: number;
    recovered: number;
    rate: number;
  }>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: RecoveryEmailType;
  subject: string;
  preheader: string;
  headline: string;
  bodyTemplate: string;
  ctaText: string;
  variables: string[];
}

// ============================================================================
// STATE
// ============================================================================

const abandonedCarts: Map<string, AbandonedCart> = new Map();
const recoveryEmails: Map<string, RecoveryEmail[]> = new Map();
const emailTemplates: Map<RecoveryEmailType, EmailTemplate> = new Map();

// Default recovery sequences
const recoverySequences: RecoverySequence[] = [
  {
    id: 'standard',
    name: 'Standard Recovery',
    isActive: true,
    conditions: [],
    steps: [
      { stepNumber: 1, delayHours: 1, emailType: 'gentle_reminder', includeUrgency: false, includeSocialProof: true },
      { stepNumber: 2, delayHours: 24, emailType: 'value_proposition', includeUrgency: false, includeSocialProof: true },
      { stepNumber: 3, delayHours: 48, emailType: 'discount_offer', discountPercent: 10, includeUrgency: true, includeSocialProof: true },
      { stepNumber: 4, delayHours: 72, emailType: 'final_urgency', discountPercent: 15, includeUrgency: true, includeSocialProof: false },
    ],
  },
  {
    id: 'high_value',
    name: 'High Value Cart Recovery',
    isActive: true,
    conditions: [{ field: 'cartValue', operator: 'greaterThan', value: 200 }],
    steps: [
      { stepNumber: 1, delayHours: 0.5, emailType: 'gentle_reminder', includeUrgency: false, includeSocialProof: true },
      { stepNumber: 2, delayHours: 12, emailType: 'value_proposition', includeUrgency: true, includeSocialProof: true },
      { stepNumber: 3, delayHours: 24, emailType: 'discount_offer', discountPercent: 5, includeUrgency: true, includeSocialProof: true },
      { stepNumber: 4, delayHours: 48, emailType: 'final_urgency', discountPercent: 10, includeUrgency: true, includeSocialProof: false },
    ],
  },
  {
    id: 'vip_customer',
    name: 'VIP Customer Recovery',
    isActive: true,
    conditions: [{ field: 'segment', operator: 'equals', value: 'vip_customer' }],
    steps: [
      { stepNumber: 1, delayHours: 2, emailType: 'gentle_reminder', includeUrgency: false, includeSocialProof: false },
      { stepNumber: 2, delayHours: 24, emailType: 'discount_offer', discountPercent: 15, includeUrgency: false, includeSocialProof: false },
    ],
  },
];

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'gentle_reminder',
    name: 'Gentle Reminder',
    type: 'gentle_reminder',
    subject: '{{customerName}}, you left something behind! 🛒',
    preheader: 'Your cart is waiting for you at Express Prime',
    headline: 'Forget Something?',
    bodyTemplate: `Hi {{customerName}},

We noticed you left some amazing items in your cart. Don't worry - we saved them for you!

{{productList}}

Your cart total: {{cartTotal}}

Complete your purchase and enjoy free shipping on orders over $50.

{{socialProof}}`,
    ctaText: 'Complete My Order',
    variables: ['customerName', 'productList', 'cartTotal', 'socialProof'],
  },
  {
    id: 'value_proposition',
    name: 'Value Proposition',
    type: 'value_proposition',
    subject: 'Still thinking about it? Here\'s why you\'ll love {{productName}} ✨',
    preheader: 'See what others are saying',
    headline: 'Great Choice!',
    bodyTemplate: `Hi {{customerName}},

You have great taste! Here's why {{productName}} is a customer favorite:

⭐ 4.8/5 stars from {{reviewCount}} reviews
🚚 Free & fast shipping
💯 30-day satisfaction guarantee
🔒 Secure checkout

{{productList}}

{{socialProof}}

Join thousands of happy customers!`,
    ctaText: 'Shop Now',
    variables: ['customerName', 'productName', 'reviewCount', 'productList', 'socialProof'],
  },
  {
    id: 'discount_offer',
    name: 'Discount Offer',
    type: 'discount_offer',
    subject: '🎁 {{discountPercent}}% OFF your cart - just for you!',
    preheader: 'Limited time offer inside',
    headline: 'Special Offer Just For You!',
    bodyTemplate: `Hi {{customerName}},

We really want you to have these items, so here's an exclusive offer:

🏷️ Use code {{discountCode}} for {{discountPercent}}% OFF

{{productList}}

Original: {{originalTotal}}
Your Price: {{discountedTotal}}
You Save: {{savings}}

⏰ Offer expires: {{expiresAt}}

{{socialProof}}`,
    ctaText: 'Claim My Discount',
    variables: ['customerName', 'discountCode', 'discountPercent', 'productList', 'originalTotal', 'discountedTotal', 'savings', 'expiresAt', 'socialProof'],
  },
  {
    id: 'final_urgency',
    name: 'Final Urgency',
    type: 'final_urgency',
    subject: '⏰ Last chance: Your cart expires soon',
    preheader: 'Don\'t miss out on {{discountPercent}}% OFF',
    headline: 'This Is Your Last Chance!',
    bodyTemplate: `Hi {{customerName}},

Your cart is about to expire, and so is your special offer:

🔥 {{discountPercent}}% OFF with code: {{discountCode}}
⏰ Expires in 24 hours

{{productList}}

{{stockWarning}}

After this, we can't guarantee availability or pricing.`,
    ctaText: 'Complete Order Now',
    variables: ['customerName', 'discountCode', 'discountPercent', 'productList', 'stockWarning'],
  },
  {
    id: 'back_in_stock',
    name: 'Back In Stock',
    type: 'back_in_stock',
    subject: '🎉 Great news! {{productName}} is back in stock',
    preheader: 'Get it before it sells out again',
    headline: 'It\'s Back!',
    bodyTemplate: `Hi {{customerName}},

Great news! {{productName}} that was in your cart is back in stock.

{{productList}}

⚡ Limited quantity available
🚚 Ships within 24 hours

Don't miss it this time!`,
    ctaText: 'Get It Now',
    variables: ['customerName', 'productName', 'productList'],
  },
  {
    id: 'price_drop',
    name: 'Price Drop Alert',
    type: 'price_drop',
    subject: '📉 Price Drop Alert: {{productName}} is now {{discountPercent}}% OFF',
    preheader: 'Your cart items are on sale!',
    headline: 'Price Drop!',
    bodyTemplate: `Hi {{customerName}},

The item in your cart just got cheaper!

{{productList}}

Was: {{originalPrice}}
Now: {{salePrice}}
You Save: {{savings}}

This sale won't last long - grab it now!`,
    ctaText: 'Buy Now',
    variables: ['customerName', 'productName', 'productList', 'originalPrice', 'salePrice', 'savings', 'discountPercent'],
  },
  {
    id: 'limited_stock',
    name: 'Limited Stock Warning',
    type: 'limited_stock',
    subject: '⚠️ Only {{stockCount}} left: {{productName}}',
    preheader: 'Your cart item is almost sold out',
    headline: 'Running Low!',
    bodyTemplate: `Hi {{customerName}},

Quick heads up - the item in your cart is almost sold out:

{{productList}}

⚠️ Only {{stockCount}} remaining

We can't hold inventory, so if you want it, now's the time!`,
    ctaText: 'Secure Mine Now',
    variables: ['customerName', 'productName', 'productList', 'stockCount'],
  },
];

// Initialize templates
defaultTemplates.forEach(t => emailTemplates.set(t.type, t));

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Track a cart for potential abandonment
 */
export function trackCart(cart: Omit<AbandonedCart, 'recoveryScore' | 'predictedValue' | 'urgencyLevel'>): AbandonedCart {
  const recoveryScore = calculateRecoveryScore(cart);
  const predictedValue = calculatePredictedValue(cart);
  const urgencyLevel = calculateUrgencyLevel(cart);
  
  const trackedCart: AbandonedCart = {
    ...cart,
    recoveryScore,
    predictedValue,
    urgencyLevel,
  };
  
  abandonedCarts.set(cart.id, trackedCart);
  return trackedCart;
}

/**
 * Mark a cart as abandoned and trigger recovery sequence
 */
export function markAsAbandoned(cartId: string): AbandonedCart | null {
  const cart = abandonedCarts.get(cartId);
  if (!cart) return null;
  
  cart.status = 'abandoned';
  cart.abandonedAt = new Date();
  
  // Update scores
  cart.recoveryScore = calculateRecoveryScore(cart);
  cart.predictedValue = calculatePredictedValue(cart);
  cart.urgencyLevel = calculateUrgencyLevel(cart);
  
  abandonedCarts.set(cartId, cart);
  
  // Schedule recovery emails
  if (cart.customerEmail) {
    scheduleRecoveryEmails(cart);
  }
  
  return cart;
}

/**
 * Generate a recovery email for a cart
 */
export function generateRecoveryEmail(
  cart: AbandonedCart,
  emailType: RecoveryEmailType,
  discountPercent?: number
): RecoveryEmail {
  const template = emailTemplates.get(emailType);
  if (!template) {
    throw new Error(`Template not found for type: ${emailType}`);
  }
  
  const id = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const discountCode = discountPercent ? generateDiscountCode(cart.id, discountPercent) : undefined;
  
  // Build product highlights (top 3 items by value)
  const productHighlights = [...cart.items]
    .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
    .slice(0, 3);
  
  // Generate social proof
  const socialProof = generateSocialProof(cart, emailType);
  
  // Build email content
  const subject = populateTemplate(template.subject, cart, discountCode, discountPercent);
  const preheader = populateTemplate(template.preheader, cart, discountCode, discountPercent);
  const headline = populateTemplate(template.headline, cart, discountCode, discountPercent);
  const bodyText = populateTemplate(template.bodyTemplate, cart, discountCode, discountPercent);
  const ctaText = template.ctaText;
  
  // Build CTA URL with tracking
  const ctaUrl = buildCtaUrl(cart, discountCode);
  
  const email: RecoveryEmail = {
    id,
    cartId: cart.id,
    type: emailType,
    subject,
    preheader,
    headline,
    bodyText,
    ctaText,
    ctaUrl,
    customerName: cart.customerName,
    productHighlights,
    discountCode,
    discountPercent,
    expiresAt: discountPercent ? new Date(Date.now() + 48 * 60 * 60 * 1000) : undefined,
    socialProof,
    isOpened: false,
    isClicked: false,
    isConverted: false,
  };
  
  // Store email
  const cartEmails = recoveryEmails.get(cart.id) || [];
  cartEmails.push(email);
  recoveryEmails.set(cart.id, cartEmails);
  
  return email;
}

/**
 * Schedule recovery emails based on sequence
 */
export function scheduleRecoveryEmails(cart: AbandonedCart): RecoveryStep[] {
  // Find matching sequence
  const sequence = findMatchingSequence(cart);
  if (!sequence) return [];
  
  const scheduledSteps: RecoveryStep[] = [];
  
  for (const step of sequence.steps) {
    if (cart.emailsSent >= step.stepNumber) continue;
    
    scheduledSteps.push(step);
    cart.emailSequence.push(`${step.emailType}:${step.delayHours}h`);
  }
  
  abandonedCarts.set(cart.id, cart);
  return scheduledSteps;
}

/**
 * Process pending recovery emails
 */
export function processPendingEmails(): Array<{ cart: AbandonedCart; email: RecoveryEmail }> {
  const toSend: Array<{ cart: AbandonedCart; email: RecoveryEmail }> = [];
  const now = new Date();
  
  for (const [, cart] of abandonedCarts) {
    if (cart.status !== 'abandoned') continue;
    if (!cart.customerEmail) continue;
    
    const sequence = findMatchingSequence(cart);
    if (!sequence) continue;
    
    for (const step of sequence.steps) {
      if (cart.emailsSent >= step.stepNumber) continue;
      
      const abandonedAt = cart.abandonedAt || cart.lastActivityAt;
      const sendAfter = new Date(abandonedAt.getTime() + step.delayHours * 60 * 60 * 1000);
      
      if (now >= sendAfter) {
        const email = generateRecoveryEmail(cart, step.emailType, step.discountPercent);
        
        // Update cart
        cart.emailsSent++;
        cart.lastEmailSentAt = now;
        if (step.discountPercent) {
          cart.discountApplied = email.discountCode;
          cart.discountPercent = step.discountPercent;
        }
        abandonedCarts.set(cart.id, cart);
        
        toSend.push({ cart, email });
        break; // Only one email per processing cycle
      }
    }
  }
  
  return toSend;
}

/**
 * Mark cart as recovered
 */
export function markAsRecovered(cartId: string, orderId: string): AbandonedCart | null {
  const cart = abandonedCarts.get(cartId);
  if (!cart) return null;
  
  cart.status = 'recovered';
  cart.recoveredAt = new Date();
  
  // Update email metrics
  const emails = recoveryEmails.get(cartId) || [];
  if (emails.length > 0) {
    const lastEmail = emails[emails.length - 1];
    lastEmail.isConverted = true;
    lastEmail.convertedAt = new Date();
  }
  
  abandonedCarts.set(cartId, cart);
  return cart;
}

/**
 * Track email opened
 */
export function trackEmailOpen(emailId: string): void {
  for (const [, emails] of recoveryEmails) {
    const email = emails.find(e => e.id === emailId);
    if (email) {
      email.isOpened = true;
      email.openedAt = new Date();
      break;
    }
  }
}

/**
 * Track email clicked
 */
export function trackEmailClick(emailId: string): void {
  for (const [, emails] of recoveryEmails) {
    const email = emails.find(e => e.id === emailId);
    if (email) {
      email.isClicked = true;
      email.clickedAt = new Date();
      break;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateRecoveryScore(cart: Omit<AbandonedCart, 'recoveryScore' | 'predictedValue' | 'urgencyLevel'>): number {
  let score = 0.5;
  
  // Has email = higher chance of recovery
  if (cart.customerEmail) score += 0.2;
  
  // Has account = even higher
  if (cart.customerId) score += 0.1;
  
  // Higher value = higher priority
  if (cart.estimatedTotal > 100) score += 0.1;
  if (cart.estimatedTotal > 200) score += 0.05;
  
  // Segment scoring
  const segmentScores: Record<CustomerSegment, number> = {
    new_visitor: 0.3,
    returning_visitor: 0.5,
    first_time_buyer: 0.6,
    repeat_customer: 0.7,
    vip_customer: 0.8,
    at_risk: 0.4,
  };
  score = Math.max(score, segmentScores[cart.segment] || 0.5);
  
  return Math.min(1, score);
}

function calculatePredictedValue(cart: Omit<AbandonedCart, 'recoveryScore' | 'predictedValue' | 'urgencyLevel'>): number {
  const baseValue = cart.estimatedTotal;
  const recoveryProbability = calculateRecoveryScore(cart);
  
  return baseValue * recoveryProbability;
}

function calculateUrgencyLevel(cart: Omit<AbandonedCart, 'recoveryScore' | 'predictedValue' | 'urgencyLevel'>): number {
  let urgency = 0.5;
  
  // Check inventory levels
  const lowStockItems = cart.items.filter(i => (i.inventoryLevel || 100) < 10);
  if (lowStockItems.length > 0) urgency += 0.3;
  
  // High value = higher urgency
  if (cart.estimatedTotal > 150) urgency += 0.2;
  
  return Math.min(1, urgency);
}

function findMatchingSequence(cart: AbandonedCart): RecoverySequence | null {
  // Sort by specificity (more conditions = higher priority)
  const sortedSequences = [...recoverySequences]
    .filter(s => s.isActive)
    .sort((a, b) => b.conditions.length - a.conditions.length);
  
  for (const sequence of sortedSequences) {
    let matches = true;
    
    for (const condition of sequence.conditions) {
      let value: string | number | boolean;
      
      switch (condition.field) {
        case 'cartValue':
          value = cart.estimatedTotal;
          break;
        case 'segment':
          value = cart.segment;
          break;
        case 'itemCount':
          value = cart.items.length;
          break;
        case 'hasAccount':
          value = !!cart.customerId;
          break;
        default:
          value = '';
      }
      
      switch (condition.operator) {
        case 'equals':
          if (value !== condition.value) matches = false;
          break;
        case 'greaterThan':
          if (typeof value !== 'number' || typeof condition.value !== 'number' || value <= condition.value) matches = false;
          break;
        case 'lessThan':
          if (typeof value !== 'number' || typeof condition.value !== 'number' || value >= condition.value) matches = false;
          break;
        case 'contains':
          if (typeof value !== 'string' || !value.includes(String(condition.value))) matches = false;
          break;
      }
      
      if (!matches) break;
    }
    
    if (matches) return sequence;
  }
  
  // Return default sequence
  return recoverySequences.find(s => s.id === 'standard') || null;
}

function generateDiscountCode(cartId: string, percent: number): string {
  const hash = cartId.substring(0, 6).toUpperCase();
  return `SAVE${percent}-${hash}`;
}

function populateTemplate(
  template: string,
  cart: AbandonedCart,
  discountCode?: string,
  discountPercent?: number
): string {
  const productList = cart.items
    .map(i => `• ${i.title} (${i.quantity}x) - $${(i.price * i.quantity).toFixed(2)}`)
    .join('\n');
  
  const topProduct = cart.items[0];
  const savings = discountPercent 
    ? (cart.estimatedTotal * discountPercent / 100).toFixed(2)
    : '0.00';
  const discountedTotal = discountPercent
    ? (cart.estimatedTotal * (1 - discountPercent / 100)).toFixed(2)
    : cart.estimatedTotal.toFixed(2);
  
  return template
    .replace(/\{\{customerName\}\}/g, cart.customerName || 'Valued Customer')
    .replace(/\{\{productName\}\}/g, topProduct?.title || 'your items')
    .replace(/\{\{productList\}\}/g, productList)
    .replace(/\{\{cartTotal\}\}/g, `$${cart.estimatedTotal.toFixed(2)}`)
    .replace(/\{\{originalTotal\}\}/g, `$${cart.estimatedTotal.toFixed(2)}`)
    .replace(/\{\{discountedTotal\}\}/g, `$${discountedTotal}`)
    .replace(/\{\{savings\}\}/g, `$${savings}`)
    .replace(/\{\{discountCode\}\}/g, discountCode || '')
    .replace(/\{\{discountPercent\}\}/g, String(discountPercent || 0))
    .replace(/\{\{reviewCount\}\}/g, String(Math.floor(Math.random() * 500 + 100)))
    .replace(/\{\{expiresAt\}\}/g, new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString())
    .replace(/\{\{stockCount\}\}/g, String(topProduct?.inventoryLevel || 5))
    .replace(/\{\{socialProof\}\}/g, '👥 147 customers purchased this today')
    .replace(/\{\{stockWarning\}\}/g, '⚠️ Only 3 left in stock');
}

function buildCtaUrl(cart: AbandonedCart, discountCode?: string): string {
  let url = `/checkout?cart_id=${cart.id}`;
  if (discountCode) url += `&discount=${discountCode}`;
  return url;
}

function generateSocialProof(cart: AbandonedCart, emailType: RecoveryEmailType): SocialProofElement | undefined {
  if (emailType === 'final_urgency') return undefined;
  
  const proofTypes: SocialProofElement[] = [
    { type: 'purchases', text: '{{count}} customers bought this today', count: Math.floor(Math.random() * 100 + 50) },
    { type: 'reviews', text: 'Rated 4.8/5 from {{count}} reviews', count: Math.floor(Math.random() * 500 + 100) },
    { type: 'viewers', text: '{{count}} people viewing this now', count: Math.floor(Math.random() * 30 + 5) },
    { type: 'stock', text: 'Only {{count}} left!', count: Math.floor(Math.random() * 10 + 3) },
  ];
  
  const proof = proofTypes[Math.floor(Math.random() * proofTypes.length)];
  proof.text = proof.text.replace('{{count}}', String(proof.count));
  
  return proof;
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export function getRecoveryStats(): RecoveryStats {
  const carts = Array.from(abandonedCarts.values());
  const allEmails = Array.from(recoveryEmails.values()).flat();
  
  const abandoned = carts.filter(c => c.status === 'abandoned' || c.status === 'recovered');
  const recovered = carts.filter(c => c.status === 'recovered');
  
  const totalAbandoned = abandoned.length || 1;
  const totalRecovered = recovered.length;
  const recoveryRate = totalRecovered / totalAbandoned;
  const revenueRecovered = recovered.reduce((sum, c) => sum + c.estimatedTotal, 0);
  const avgCartValue = abandoned.reduce((sum, c) => sum + c.estimatedTotal, 0) / totalAbandoned;
  
  // Email metrics
  const emailsSent = allEmails.filter(e => e.sentAt).length || 1;
  const opened = allEmails.filter(e => e.isOpened).length;
  const clicked = allEmails.filter(e => e.isClicked).length;
  const converted = allEmails.filter(e => e.isConverted).length;
  
  const openRate = opened / emailsSent;
  const clickRate = clicked / emailsSent;
  const conversionRate = converted / emailsSent;
  
  // Step performance
  const stepPerformance = [1, 2, 3, 4].map(step => {
    const stepEmails = allEmails.filter((_, i) => (i % 4) + 1 === step);
    return {
      step,
      sent: stepEmails.length,
      opened: stepEmails.filter(e => e.isOpened).length,
      clicked: stepEmails.filter(e => e.isClicked).length,
      converted: stepEmails.filter(e => e.isConverted).length,
    };
  });
  
  // Segment performance
  const segments: CustomerSegment[] = ['new_visitor', 'returning_visitor', 'first_time_buyer', 'repeat_customer', 'vip_customer', 'at_risk'];
  const segmentPerformance = segments.map(segment => {
    const segmentCarts = abandoned.filter(c => c.segment === segment);
    const segmentRecovered = segmentCarts.filter(c => c.status === 'recovered');
    return {
      segment,
      abandoned: segmentCarts.length,
      recovered: segmentRecovered.length,
      rate: segmentCarts.length > 0 ? segmentRecovered.length / segmentCarts.length : 0,
    };
  });
  
  return {
    totalAbandoned,
    totalRecovered,
    recoveryRate,
    revenueRecovered,
    avgCartValue,
    emailsSent,
    openRate,
    clickRate,
    conversionRate,
    stepPerformance,
    segmentPerformance,
  };
}

export function getAbandonedCarts(status?: CartStatus): AbandonedCart[] {
  const carts = Array.from(abandonedCarts.values());
  if (status) {
    return carts.filter(c => c.status === status);
  }
  return carts;
}

export function getCartEmails(cartId: string): RecoveryEmail[] {
  return recoveryEmails.get(cartId) || [];
}

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockAbandonedCarts(): AbandonedCart[] {
  const segments: CustomerSegment[] = ['new_visitor', 'returning_visitor', 'first_time_buyer', 'repeat_customer'];
  const mockCarts: AbandonedCart[] = [];
  
  for (let i = 0; i < 25; i++) {
    const items: CartItem[] = [
      {
        productId: `prod-${i}-1`,
        title: ['Premium Headphones', 'Smart Watch', 'Wireless Earbuds', 'Phone Case', 'Laptop Stand'][i % 5],
        price: [79.99, 199.99, 49.99, 19.99, 89.99][i % 5],
        quantity: Math.floor(Math.random() * 2) + 1,
        imageUrl: 'https://via.placeholder.com/150',
        inventoryLevel: Math.floor(Math.random() * 50) + 5,
      },
    ];
    
    if (Math.random() > 0.5) {
      items.push({
        productId: `prod-${i}-2`,
        title: ['USB Cable', 'Screen Protector', 'Charging Pad', 'Memory Card'][i % 4],
        price: [14.99, 9.99, 29.99, 24.99][i % 4],
        quantity: 1,
        imageUrl: 'https://via.placeholder.com/150',
      });
    }
    
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const segment = segments[i % segments.length];
    const status: CartStatus = i < 15 ? 'abandoned' : i < 20 ? 'recovered' : 'active';
    
    const cart = trackCart({
      id: `cart-${1000 + i}`,
      sessionId: `session-${Math.random().toString(36).substr(2, 12)}`,
      customerId: i % 3 === 0 ? `cust-${i}` : undefined,
      customerEmail: i % 2 === 0 ? `customer${i}@example.com` : undefined,
      customerName: i % 2 === 0 ? ['John', 'Jane', 'Mike', 'Sarah', 'Chris'][i % 5] : undefined,
      items,
      subtotal,
      estimatedTotal: subtotal * 1.08,
      currency: 'USD',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
      abandonedAt: status !== 'active' ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000) : undefined,
      recoveredAt: status === 'recovered' ? new Date() : undefined,
      status,
      segment,
      emailsSent: status === 'abandoned' ? Math.floor(Math.random() * 3) : status === 'recovered' ? Math.floor(Math.random() * 2) + 1 : 0,
      lastEmailSentAt: status !== 'active' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined,
      emailSequence: [],
      discountApplied: status === 'recovered' ? `SAVE10-ABC${i}` : undefined,
      discountPercent: status === 'recovered' ? 10 : undefined,
    });
    
    mockCarts.push(cart);
    
    // Generate mock emails for abandoned/recovered carts
    if (status !== 'active') {
      const emailCount = cart.emailsSent;
      const emailTypes: RecoveryEmailType[] = ['gentle_reminder', 'value_proposition', 'discount_offer', 'final_urgency'];
      
      for (let j = 0; j < emailCount; j++) {
        const email = generateRecoveryEmail(cart, emailTypes[j], j >= 2 ? [10, 15][j - 2] : undefined);
        email.sentAt = new Date(Date.now() - (emailCount - j) * 24 * 60 * 60 * 1000);
        email.isOpened = Math.random() > 0.4;
        email.isClicked = email.isOpened && Math.random() > 0.6;
        email.isConverted = status === 'recovered' && j === emailCount - 1;
        
        if (email.isOpened) email.openedAt = new Date(email.sentAt.getTime() + Math.random() * 60 * 60 * 1000);
        if (email.isClicked) email.clickedAt = new Date(email.openedAt!.getTime() + Math.random() * 30 * 60 * 1000);
        if (email.isConverted) email.convertedAt = new Date(email.clickedAt!.getTime() + Math.random() * 60 * 60 * 1000);
      }
    }
  }
  
  return mockCarts;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core functions
  trackCart,
  markAsAbandoned,
  markAsRecovered,
  generateRecoveryEmail,
  scheduleRecoveryEmails,
  processPendingEmails,
  // Tracking
  trackEmailOpen,
  trackEmailClick,
  // Data access
  getRecoveryStats,
  getAbandonedCarts,
  getCartEmails,
  // Mock data
  generateMockAbandonedCarts,
};
