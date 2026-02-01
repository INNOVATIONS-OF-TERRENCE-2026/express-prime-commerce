import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { BRAND } from '@/lib/constants';

const policies = {
  shipping: {
    title: 'Shipping Policy',
    lastUpdated: 'January 2026',
    content: `
## Shipping Methods & Timeframes

At ${BRAND.name}, we strive to get your orders to you as quickly as possible.

### Standard Shipping
- **Cost:** FREE on orders over $49, otherwise $5.99
- **Timeframe:** 5-7 business days
- **Carrier:** USPS or UPS

### Express Shipping
- **Cost:** $9.99
- **Timeframe:** 2-3 business days
- **Carrier:** UPS or FedEx

## Processing Time

- Orders are processed within 1-2 business days
- Orders placed on weekends or holidays will be processed the next business day
- You will receive a shipping confirmation email with tracking information once your order ships

## Shipping Locations

We currently ship to all 50 US states. We do not ship internationally at this time.

## Order Tracking

Once your order ships, you will receive an email with your tracking number. You can also track your order on our [Order Tracking](/order-tracking) page.

## Shipping Issues

If your package is lost, damaged, or significantly delayed, please contact our support team at ${BRAND.email} within 7 days of the expected delivery date.
    `
  },
  refunds: {
    title: 'Refund & Returns Policy',
    lastUpdated: 'January 2026',
    content: `
## 30-Day Hassle-Free Returns

We want you to be completely satisfied with your purchase. If you're not happy with your order, we offer a 30-day return policy.

### Eligibility

To be eligible for a return, your item must be:
- Unused and in the same condition that you received it
- In the original packaging
- Returned within 30 days of delivery

### Non-Returnable Items

The following items cannot be returned:
- Gift cards
- Downloadable products
- Personal care items that have been opened
- Items marked as "Final Sale"

### How to Return

1. Visit our [Order Tracking](/order-tracking) page
2. Find your order and click "Request Return"
3. Select the items you wish to return
4. Print the prepaid shipping label (for defective items) or use your own shipping
5. Package the items securely and drop off at any carrier location

### Refund Process

- Refunds are processed within 5-7 business days after we receive your return
- Refunds will be issued to the original payment method
- Original shipping costs are non-refundable unless the return is due to our error

### Exchanges

We do not offer direct exchanges. Please return your item for a refund and place a new order.

### Damaged or Defective Items

If you receive a damaged or defective item, please contact us immediately at ${BRAND.email} with photos of the damage. We will provide a prepaid return label and send a replacement at no additional cost.
    `
  },
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'January 2026',
    content: `
## Agreement to Terms

By accessing and using ${BRAND.name}'s website and services, you agree to be bound by these Terms of Service.

### Use of Our Service

- You must be at least 18 years old to use our services
- You are responsible for maintaining the confidentiality of your account
- You agree not to use our services for any illegal or unauthorized purpose
- You must not transmit any malicious code or attempt to interfere with our services

### Products and Pricing

- All prices are listed in US Dollars (USD)
- We reserve the right to change prices without notice
- Product images are for illustration purposes only; actual products may vary slightly
- We reserve the right to limit quantities or refuse orders at our discretion

### Orders and Payment

- By placing an order, you agree to pay the total amount including applicable taxes and shipping
- We accept major credit cards, PayPal, and other payment methods as displayed at checkout
- Orders are subject to acceptance and availability

### Intellectual Property

- All content on this website is the property of ${BRAND.name}
- You may not reproduce, distribute, or create derivative works without our permission
- Product names and logos are trademarks of their respective owners

### Limitation of Liability

${BRAND.name} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.

### Governing Law

These terms shall be governed by the laws of the State of Texas, USA.

### Changes to Terms

We reserve the right to modify these terms at any time. Continued use of our services constitutes acceptance of updated terms.
    `
  },
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'January 2026',
    content: `
## Your Privacy Matters

At ${BRAND.name}, we are committed to protecting your privacy and personal information.

### Information We Collect

**Personal Information:**
- Name, email address, and phone number
- Shipping and billing addresses
- Payment information (processed securely by our payment providers)
- Order history

**Automatically Collected:**
- IP address and browser type
- Pages visited and time spent on site
- Device information
- Cookies and similar technologies

### How We Use Your Information

We use your information to:
- Process and fulfill your orders
- Send order confirmations and shipping updates
- Respond to customer service inquiries
- Improve our website and services
- Send marketing communications (with your consent)
- Prevent fraud and ensure security

### Information Sharing

We do not sell your personal information. We may share information with:
- Shipping carriers to deliver your orders
- Payment processors to complete transactions
- Service providers who assist our operations
- Law enforcement when required by law

### Data Security

We implement industry-standard security measures including:
- SSL encryption for all data transmission
- Secure data storage with access controls
- Regular security audits and updates

### Your Rights

You have the right to:
- Access your personal information
- Request correction of inaccurate data
- Request deletion of your data
- Opt out of marketing communications
- Request a copy of your data

### Cookies

We use cookies to improve your browsing experience. You can manage cookie preferences in your browser settings.

### Contact Us

For privacy-related inquiries, contact us at:
- Email: ${BRAND.email}
- Address: Austin, TX USA

### Policy Updates

We may update this policy periodically. The latest version will always be available on our website.
    `
  }
};

export default function PolicyPage() {
  const { type } = useParams<{ type: string }>();
  const policy = policies[type as keyof typeof policies];

  if (!policy) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Policy Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The policy page you're looking for doesn't exist.
          </p>
          <Link to="/" className="text-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{policy.title}</span>
        </nav>

        <article className="prose prose-slate max-w-none">
          <header className="not-prose mb-8 pb-8 border-b">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{policy.title}</h1>
            <p className="text-muted-foreground">Last updated: {policy.lastUpdated}</p>
          </header>

          <div 
            className="prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-ul:text-muted-foreground prose-li:my-1"
            dangerouslySetInnerHTML={{ 
              __html: policy.content
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                .replace(/^- (.*$)/gim, '<li>$1</li>')
                .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
            }}
          />
        </article>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t">
          <h3 className="font-semibold mb-4">Other Policies</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(policies).map(([key, p]) => (
              key !== type && (
                <Link
                  key={key}
                  to={`/policies/${key}`}
                  className="text-primary hover:underline text-sm"
                >
                  {p.title}
                </Link>
              )
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
