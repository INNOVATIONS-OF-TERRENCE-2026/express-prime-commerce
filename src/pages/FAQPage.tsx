import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { 
  Search, 
  HelpCircle, 
  Package, 
  CreditCard, 
  Truck, 
  RotateCcw,
  Shield,
  Bot,
  ChevronDown,
  MessageCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BRAND, PUBLIC_ROUTES } from '@/lib/constants';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  icon: React.ElementType;
  title: string;
  description: string;
  items: FAQItem[];
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>('orders');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const faqCategories: Record<string, FAQCategory> = {
    orders: {
      icon: Package,
      title: 'Orders & Tracking',
      description: 'Order status, tracking, and modifications',
      items: [
        {
          question: 'How do I track my order?',
          answer: 'You can track your order by visiting the Order Tracking page and entering your order number and email address. You\'ll receive tracking updates via email as your package moves through our fulfillment process.',
        },
        {
          question: 'Can I modify or cancel my order?',
          answer: 'Orders can be modified or cancelled within 1 hour of placement. After that, our AI-powered fulfillment system begins processing immediately. Contact our support team as soon as possible if you need changes.',
        },
        {
          question: 'What happens if my order is delayed?',
          answer: 'If your order experiences unexpected delays, you\'ll receive automatic email notifications. For delays beyond the estimated delivery window, contact support for assistance and potential compensation options.',
        },
        {
          question: 'How do I know my order was successfully placed?',
          answer: 'You\'ll receive an order confirmation email immediately after checkout. This email contains your order number, items purchased, and estimated delivery date.',
        },
      ],
    },
    shipping: {
      icon: Truck,
      title: 'Shipping & Delivery',
      description: 'Shipping options, times, and policies',
      items: [
        {
          question: 'What are your shipping options?',
          answer: 'We offer Standard Shipping (5-7 business days), Express Shipping (2-3 business days), and Next-Day Delivery (where available). Free shipping is available on orders over $49.',
        },
        {
          question: 'Do you ship internationally?',
          answer: 'Yes! We ship to over 50 countries worldwide. International shipping times vary by destination, typically 7-14 business days. Import duties and taxes may apply.',
        },
        {
          question: 'How do I get free shipping?',
          answer: 'Orders totaling $49 or more automatically qualify for free standard shipping within the continental United States. No promo code required!',
        },
        {
          question: 'Can I change my shipping address?',
          answer: 'Shipping address changes can be made within 1 hour of placing your order. After processing begins, address changes may not be possible. Contact support immediately for assistance.',
        },
      ],
    },
    payments: {
      icon: CreditCard,
      title: 'Payments & Pricing',
      description: 'Payment methods, billing, and pricing',
      items: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay. All transactions are secured with 256-bit encryption.',
        },
        {
          question: 'When will my card be charged?',
          answer: 'Your card is charged immediately upon order confirmation. For pre-order items, you may see a temporary authorization that converts to a charge when the item ships.',
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Absolutely. We use industry-leading encryption and never store your full card details on our servers. All payments are processed through PCI-compliant payment processors.',
        },
        {
          question: 'Do you offer price matching?',
          answer: 'Our AI-powered pricing ensures competitive rates. If you find an identical item at a lower price from an authorized retailer within 7 days, contact us for a price match review.',
        },
      ],
    },
    returns: {
      icon: RotateCcw,
      title: 'Returns & Refunds',
      description: 'Return policies and refund processes',
      items: [
        {
          question: 'What is your return policy?',
          answer: 'We offer hassle-free returns within 30 days of delivery. Items must be unused, in original packaging, with all tags attached. Some items like personalized products may be final sale.',
        },
        {
          question: 'How do I initiate a return?',
          answer: 'Visit your order in the Order Tracking page, select the items to return, and print your prepaid return label. Drop off at any authorized shipping location.',
        },
        {
          question: 'When will I receive my refund?',
          answer: 'Refunds are processed within 3-5 business days of receiving your return. The refund will appear on your original payment method within 5-10 business days depending on your bank.',
        },
        {
          question: 'Do you offer exchanges?',
          answer: 'Yes! For size or color exchanges on eligible items, select "Exchange" when initiating your return. We\'ll ship the replacement as soon as we receive the original item.',
        },
      ],
    },
    ai: {
      icon: Bot,
      title: 'AI & Smart Features',
      description: 'How our AI technology works for you',
      items: [
        {
          question: 'How does AI Picks work?',
          answer: 'Our AI analyzes product data, trending patterns, customer reviews, and visual appeal to curate products most likely to delight you. It learns from browsing patterns to improve recommendations over time.',
        },
        {
          question: 'What makes your product curation different?',
          answer: 'Unlike traditional e-commerce, our AI evaluates products on 50+ quality signals including supplier reliability, customer satisfaction, trend momentum, and value metrics to surface only the best options.',
        },
        {
          question: 'Is my data used for AI recommendations?',
          answer: 'Your browsing and purchase history improves your personal recommendations. We never sell your data to third parties. You can opt out of personalized recommendations in account settings.',
        },
        {
          question: 'How accurate are the AI predictions?',
          answer: 'Our AI predictions have a 92% satisfaction rate among customers who purchase AI-recommended products. We continuously improve our models based on feedback and outcomes.',
        },
      ],
    },
    security: {
      icon: Shield,
      title: 'Security & Privacy',
      description: 'Data protection and account security',
      items: [
        {
          question: 'How do you protect my personal information?',
          answer: 'We use bank-level encryption, secure servers, and strict access controls. Your data is protected under our comprehensive privacy policy and we comply with GDPR, CCPA, and other privacy regulations.',
        },
        {
          question: 'Is my account secure?',
          answer: 'We recommend enabling two-factor authentication for added security. We also monitor for suspicious activity and will alert you to any unauthorized access attempts.',
        },
        {
          question: 'Can I delete my account and data?',
          answer: 'Yes. You can request complete account deletion through settings or by contacting support. We\'ll remove all personal data within 30 days as required by privacy regulations.',
        },
        {
          question: 'Do you share my information with third parties?',
          answer: 'We only share data with essential service providers (shipping, payments) to fulfill your orders. We never sell your personal information to marketers or data brokers.',
        },
      ],
    },
  };

  const toggleQuestion = (categoryKey: string, questionIndex: number) => {
    const key = `${categoryKey}-${questionIndex}`;
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedQuestions(newExpanded);
  };

  const filteredCategories = Object.entries(faqCategories).reduce((acc, [key, category]) => {
    if (!searchQuery) {
      acc[key] = category;
      return acc;
    }
    
    const filteredItems = category.items.filter(
      item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filteredItems.length > 0) {
      acc[key] = { ...category, items: filteredItems };
    }
    
    return acc;
  }, {} as Record<string, FAQCategory>);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-primary to-slate-900 text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <HelpCircle className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Help Center</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked <span className="text-gradient-gold">Questions</span>
            </h1>
            
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              Find answers to common questions about orders, shipping, returns, and more.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-white text-foreground rounded-xl shadow-lg border-0"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="sticky top-20 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-2 py-4 scrollbar-hide">
            {Object.entries(faqCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all',
                  activeCategory === key
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <category.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.title}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {Object.keys(filteredCategories).length === 0 ? (
            <div className="text-center py-16">
              <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-6">
                Try different keywords or browse categories above
              </p>
              <Button onClick={() => setSearchQuery('')} variant="outline">
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(filteredCategories).map(([key, category]) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  id={key}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <category.icon className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{category.title}</h2>
                      <p className="text-muted-foreground text-sm">{category.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {category.items.map((item, index) => {
                      const isExpanded = expandedQuestions.has(`${key}-${index}`);
                      return (
                        <div
                          key={index}
                          className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <button
                            onClick={() => toggleQuestion(key, index)}
                            className="w-full flex items-center justify-between p-5 text-left"
                          >
                            <span className="font-medium pr-4">{item.question}</span>
                            <ChevronDown 
                              className={cn(
                                'w-5 h-5 text-muted-foreground transition-transform flex-shrink-0',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </button>
                          <motion.div
                            initial={false}
                            animate={{ height: isExpanded ? 'auto' : 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 text-muted-foreground border-t pt-4">
                              {item.answer}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help CTA */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <MessageCircle className="w-16 h-16 text-accent mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Still Have Questions?
            </h2>
            <p className="text-muted-foreground mb-8">
              Our support team is available 24/7 to help with any questions not covered here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white">
                <Link to={PUBLIC_ROUTES.support}>
                  Contact Support
                  <MessageCircle className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`mailto:${BRAND.email}`}>
                  Email Us
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-xl font-bold mb-8 text-center">Quick Links</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Link
              to={PUBLIC_ROUTES.orderTracking}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border hover:border-accent hover:shadow-md transition-all"
            >
              <Package className="w-8 h-8 text-accent" />
              <div>
                <div className="font-medium">Track Order</div>
                <div className="text-sm text-muted-foreground">Check status</div>
              </div>
            </Link>
            <Link
              to={PUBLIC_ROUTES.shipping}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border hover:border-accent hover:shadow-md transition-all"
            >
              <Truck className="w-8 h-8 text-accent" />
              <div>
                <div className="font-medium">Shipping Info</div>
                <div className="text-sm text-muted-foreground">Delivery options</div>
              </div>
            </Link>
            <Link
              to={PUBLIC_ROUTES.refunds}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border hover:border-accent hover:shadow-md transition-all"
            >
              <RotateCcw className="w-8 h-8 text-accent" />
              <div>
                <div className="font-medium">Returns</div>
                <div className="text-sm text-muted-foreground">Return policy</div>
              </div>
            </Link>
            <Link
              to={PUBLIC_ROUTES.privacy}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border hover:border-accent hover:shadow-md transition-all"
            >
              <Shield className="w-8 h-8 text-accent" />
              <div>
                <div className="font-medium">Privacy</div>
                <div className="text-sm text-muted-foreground">Data protection</div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
