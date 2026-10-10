import { TrackedProduct } from '../types';

export const CLOTHING_PRODUCTS: TrackedProduct[] = [
  // 1. Electronics
  {
    id: 'prod-elec-01',
    name: 'Wireless ANC Pro Headphones',
    price: 4999,
    originalPrice: 6999,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    category: 'Electronics',
    tags: ['Active Noise Cancelling', 'Bluetooth 5.3', '40hr Battery'],
    hasBuyButton: true
  },
  // 2. Apparel
  {
    id: 'prod-denim-01',
    name: 'Oversized Washed Denim Jacket',
    price: 2899,
    originalPrice: 3599,
    image: '/src/assets/images/oversized_denim_jacket_1791483543554.jpg',
    category: 'Apparel',
    tags: ['Bestseller', 'Vintage Wash', 'Drop Shoulder'],
    hasBuyButton: true
  },
  // 3. Beauty & Cosmetics
  {
    id: 'prod-beauty-02',
    name: 'Botanical Glow Hydrating Serum',
    price: 1499,
    originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    category: 'Beauty & Cosmetics',
    tags: ['Hyaluronic Acid', '100% Organic', 'Cruelty Free'],
    hasBuyButton: true
  },
  // 4. Home & Kitchen
  {
    id: 'prod-home-03',
    name: 'Minimalist Artisan Coffee Maker',
    price: 3499,
    originalPrice: 4299,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80',
    category: 'Home & Kitchen',
    tags: ['Borosilicate Glass', 'Stainless Mesh', 'Ergonomic'],
    hasBuyButton: true
  },
  // 5. Streetwear Hoodie
  {
    id: 'prod-hoodie-02',
    name: 'Heavyweight Black Printed Hoodie',
    price: 1999,
    originalPrice: 2499,
    image: '/src/assets/images/black_printed_hoodie_1791483555062.jpg',
    category: 'Apparel',
    tags: ['Heavyweight 400GSM', 'Relaxed Fit', 'Graphic'],
    hasBuyButton: true
  },
  // 6. Non-Ecommerce / Service / WhatsApp Enquiry Product (NO Buy Button)
  {
    id: 'prod-service-04',
    name: 'Bespoke Brand & Bulk Manufacturing Inquiry',
    price: 0,
    image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=600&q=80',
    category: 'Services / Custom',
    tags: ['B2B Wholesale', 'Custom Specs', 'WhatsApp / Enquiry Only'],
    hasBuyButton: false
  }
];
