import { render } from 'preact';
import { useState } from 'preact/hooks';

interface ProductSpec {
  title: string;
  price: string;
  compareAtPrice: string;
  productType: string;
  tags: string[];
  description: string;
}

interface CreatedProduct {
  title: string;
  price: string;
  productType: string;
}

interface FailedProduct {
  title: string;
  error: string;
}

declare const shopify: {
  query: (query: string, options: { variables: any }) => Promise<{ data: any; errors?: any[] }>;
};

function Extension() {
  const [creating, setCreating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [successProducts, setSuccessProducts] = useState<CreatedProduct[]>([]);
  const [failedProducts, setFailedProducts] = useState<FailedProduct[]>([]);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const productSpecs: ProductSpec[] = [
    {
      title: 'WiFi Smart LED Light Bulbs - Voice Control & App Enabled (4-Pack)',
      price: '39.95',
      compareAtPrice: '69.99',
      productType: 'Smart Home',
      tags: ['smart-tech', 'trending', 'bestseller', 'ai-pick'],
      description: 'Transform your home with intelligent lighting. These WiFi-enabled LED bulbs offer seamless voice control compatibility and smartphone app integration.',
    },
    {
      title: '3-in-1 Wireless Charging Station - Fast Charge for iPhone, AirPods & Apple Watch',
      price: '49.95',
      compareAtPrice: '89.99',
      productType: 'Electronics',
      tags: ['smart-tech', 'bestseller', 'new', 'ai-pick'],
      description: 'Eliminate cable clutter with this premium all-in-one charging solution.',
    },
    {
      title: 'USB Rechargeable Portable Blender - Personal Size Smoothie Maker',
      price: '34.95',
      compareAtPrice: '59.99',
      productType: 'Kitchen Gadgets',
      tags: ['trending', 'bestseller', 'ai-pick'],
      description: 'Blend healthy smoothies anywhere with this powerful cordless blender.',
    },
    {
      title: 'Smart Fingerprint Door Lock - Keyless Entry with App Control',
      price: '129.95',
      compareAtPrice: '199.99',
      productType: 'Smart Home',
      tags: ['smart-tech', 'new', 'ai-pick'],
      description: 'Upgrade your home security with cutting-edge biometric technology.',
    },
    {
      title: 'HEPA Air Purifier with UV-C Light - Smart Auto Mode',
      price: '89.95',
      compareAtPrice: '149.99',
      productType: 'Smart Home',
      tags: ['smart-tech', 'bestseller', 'ai-pick'],
      description: 'Breathe cleaner, healthier air with this advanced purification system.',
    },
    {
      title: 'Cordless Neck and Shoulder Massager - Deep Tissue Shiatsu',
      price: '59.95',
      compareAtPrice: '99.99',
      productType: 'Health & Wellness',
      tags: ['trending', 'bestseller', 'ai-pick'],
      description: 'Relieve tension and muscle soreness with professional-grade massage therapy.',
    },
    {
      title: 'WiFi Security Camera 2-Pack - 2K HD Night Vision',
      price: '79.95',
      compareAtPrice: '139.99',
      productType: 'Smart Home',
      tags: ['smart-tech', 'trending', 'bestseller'],
      description: 'Monitor your property with crystal-clear 2K resolution.',
    },
    {
      title: 'Sonic Electric Toothbrush with 8 Brush Heads',
      price: '44.95',
      compareAtPrice: '79.99',
      productType: 'Health & Wellness',
      tags: ['trending', 'bestseller', 'ai-pick'],
      description: 'Achieve dentist-level cleaning at home with 40,000 vibrations per minute.',
    },
    {
      title: 'Robot Vacuum Cleaner with Mopping - Self-Charging',
      price: '179.95',
      compareAtPrice: '299.99',
      productType: 'Smart Home',
      tags: ['smart-tech', 'trending', 'bestseller', 'ai-pick'],
      description: 'Experience effortless floor cleaning with intelligent navigation.',
    },
    {
      title: 'Adjustable Laptop Stand - Ergonomic Aluminum Riser',
      price: '29.95',
      compareAtPrice: '49.99',
      productType: 'Office Accessories',
      tags: ['trending', 'bestseller', 'ai-pick'],
      description: 'Improve posture and reduce neck strain with this premium stand.',
    },
    {
      title: 'Wireless Earbuds Bluetooth 5.3 - 40H Playtime',
      price: '39.95',
      compareAtPrice: '79.99',
      productType: 'Electronics',
      tags: ['smart-tech', 'trending', 'bestseller', 'ai-pick'],
      description: 'Immerse yourself in premium sound quality with noise cancellation.',
    },
    {
      title: 'Massage Gun Deep Tissue - 30 Speeds',
      price: '89.95',
      compareAtPrice: '159.99',
      productType: 'Health & Wellness',
      tags: ['trending', 'bestseller', 'ai-pick'],
      description: 'Experience professional-grade muscle therapy at home.',
    },
    {
      title: 'Smart LED Strip Lights 50ft - RGB Music Sync',
      price: '34.95',
      compareAtPrice: '69.99',
      productType: 'Smart Home',
      tags: ['smart-tech', 'trending', 'bestseller', 'ai-pick'],
      description: 'Create stunning lighting effects with app-controlled RGB LED strips.',
    },
    {
      title: 'Portable Monitor 15.6 Inch - USB-C HDMI',
      price: '129.95',
      compareAtPrice: '199.99',
      productType: 'Computer Accessories',
      tags: ['smart-tech', 'trending', 'new', 'ai-pick'],
      description: 'Boost productivity with a second screen anywhere you work.',
    },
    {
      title: 'Essential Oil Diffuser 400ml - 7 LED Colors',
      price: '29.95',
      compareAtPrice: '54.99',
      productType: 'Home & Living',
      tags: ['trending', 'bestseller', 'ai-pick'],
      description: 'Create a relaxing atmosphere with soothing aromatherapy.',
    },
  ];

  const createProducts = async (): Promise<void> => {
    setCreating(true);
    setProgress(0);
    setSuccessProducts([]);
    setFailedProducts([]);
    setShowSummary(false);

    const successList: CreatedProduct[] = [];
    const failedList: FailedProduct[] = [];
    let consecutiveFailures = 0;

    for (let i = 0; i < productSpecs.length; i++) {
      const spec = productSpecs[i];

      try {
        const createProductMutation = `mutation CreateProduct($product: ProductCreateInput!) {
          productCreate(product: $product) {
            product {
              id
              title
              productType
              variants(first: 1) {
                nodes { id }
              }
            }
            userErrors { field message }
          }
        }`;

        const { data: createData, errors: createErrors } = await shopify.query(
          createProductMutation,
          {
            variables: {
              product: {
                title: spec.title,
                descriptionHtml: spec.description,
                vendor: 'Express Prime',
                productType: spec.productType,
                tags: spec.tags,
                status: 'ACTIVE',
              },
            },
          },
        );

        if (createErrors?.length) {
          failedList.push({ title: spec.title, error: createErrors.map((e: any) => e.message).join(', ') });
          consecutiveFailures++;
          if (consecutiveFailures >= 3) break;
          setProgress(i + 1);
          continue;
        }

        if (createData?.productCreate?.userErrors?.length) {
          failedList.push({ title: spec.title, error: createData.productCreate.userErrors.map((e: any) => e.message).join(', ') });
          consecutiveFailures++;
          if (consecutiveFailures >= 3) break;
          setProgress(i + 1);
          continue;
        }

        const productId = createData?.productCreate?.product?.id;
        const variantId = createData?.productCreate?.product?.variants?.nodes?.[0]?.id;

        if (productId && variantId) {
          await shopify.query(
            `mutation UpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                productVariants { id price compareAtPrice }
                userErrors { field message }
              }
            }`,
            {
              variables: {
                productId,
                variants: [{ id: variantId, price: spec.price, compareAtPrice: spec.compareAtPrice }],
              },
            },
          );
        }

        successList.push({ title: spec.title, price: spec.price, productType: spec.productType });
        consecutiveFailures = 0;
      } catch (err: any) {
        failedList.push({ title: spec.title, error: err.message || 'Unknown error' });
        consecutiveFailures++;
        if (consecutiveFailures >= 3) break;
      }

      setProgress(i + 1);
    }

    setSuccessProducts(successList);
    setFailedProducts(failedList);
    setShowSummary(true);
    setCreating(false);
  };

  const getSummaryTone = () => failedProducts.length === 0 ? 'success' : successProducts.length === 0 ? 'critical' : 'warning';

  return (
    <s-page id="main-page" heading="Express Prime Product Creator">
      <s-section id="header-section">
        <s-text id="description-text">
          Create high-quality products for Express Prime with a single click.
        </s-text>
        <s-button id="create-button" variant="primary" onClick={createProducts} loading={creating} disabled={creating}>
          {creating ? 'Creating Products...' : `Create ${productSpecs.length} Products`}
        </s-button>
      </s-section>

      {showSummary && (
        <s-banner id="summary-banner" tone={getSummaryTone()} dismissible>
          <s-text id="summary-text">
            Created {successProducts.length} of {productSpecs.length} products.
            {failedProducts.length > 0 && ` ${failedProducts.length} failed.`}
          </s-text>
        </s-banner>
      )}

      {creating && (
        <s-section id="progress-section">
          <s-stack id="progress-stack" direction="inline" gap="base" alignItems="center">
            <s-spinner id="progress-spinner" accessibilityLabel="Creating products" />
            <s-text id="progress-text">Created {progress} of {productSpecs.length} products...</s-text>
          </s-stack>
        </s-section>
      )}

      {successProducts.length > 0 && (
        <s-section id="success-section" padding="none">
          <s-box padding="base">
            <s-heading id="success-heading">Created ({successProducts.length})</s-heading>
          </s-box>
          <s-table id="success-table">
            <s-table-header-row id="success-header">
              <s-table-header id="h-title" listSlot="primary">Title</s-table-header>
              <s-table-header id="h-price">Price</s-table-header>
              <s-table-header id="h-type">Type</s-table-header>
            </s-table-header-row>
            <s-table-body id="success-body">
              {successProducts.map((p, i) => (
                <s-table-row id={`sr-${i}`} key={i}>
                  <s-table-cell id={`sc-t-${i}`}><s-text type="strong">{p.title}</s-text></s-table-cell>
                  <s-table-cell id={`sc-p-${i}`}><s-text>${p.price}</s-text></s-table-cell>
                  <s-table-cell id={`sc-ty-${i}`}><s-text color="subdued">{p.productType}</s-text></s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        </s-section>
      )}

      {failedProducts.length > 0 && (
        <s-section id="failed-section" padding="none">
          <s-box padding="base">
            <s-heading id="failed-heading">Failed ({failedProducts.length})</s-heading>
          </s-box>
          <s-table id="failed-table">
            <s-table-header-row id="failed-header">
              <s-table-header id="fh-title" listSlot="primary">Title</s-table-header>
              <s-table-header id="fh-error">Error</s-table-header>
            </s-table-header-row>
            <s-table-body id="failed-body">
              {failedProducts.map((p, i) => (
                <s-table-row id={`fr-${i}`} key={i}>
                  <s-table-cell id={`fc-t-${i}`}><s-text type="strong">{p.title}</s-text></s-table-cell>
                  <s-table-cell id={`fc-e-${i}`}><s-text tone="critical">{p.error}</s-text></s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        </s-section>
      )}
    </s-page>
  );
}

export default (): void => render(<Extension />, document.body);
