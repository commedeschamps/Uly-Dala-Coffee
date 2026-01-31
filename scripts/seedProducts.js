require('dotenv').config();
const connectDB = require('../config/db');
const { Product } = require('../models/Product');

const products = [
  {
    name: 'Americano',
    category: 'Beverage',
    description: 'Bold espresso over hot water for a clean finish.',
    imageUrl: '/images/americano.jpeg',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 1400 },
      { label: 'medium', price: 1700 },
      { label: 'large', price: 2000 },
    ],
  },
  {
    name: 'Cappuccino',
    category: 'Beverage',
    description: 'Rich espresso topped with airy milk foam.',
    imageUrl: '/images/cappuccino.jpeg',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 1700 },
      { label: 'medium', price: 2000 },
      { label: 'large', price: 2300 },
    ],
  },
  {
    name: 'Espresso',
    category: 'Beverage',
    description: 'Short, intense shot with a smooth crema.',
    imageUrl: '/images/espresso.jpg',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 1200 },
      { label: 'medium', price: 1400 },
      { label: 'large', price: 1600 },
    ],
  },
  {
    name: 'Latte',
    category: 'Beverage',
    description: 'Smooth espresso with steamed milk and light foam.',
    imageUrl: '/images/latte.jpeg',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 1800 },
      { label: 'medium', price: 2100 },
      { label: 'large', price: 2400 },
    ],
  },
  {
    name: 'Iced Latte',
    category: 'Beverage',
    description: 'Chilled espresso with milk over ice.',
    imageUrl: '/images/iced_latte.jpeg',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 1900 },
      { label: 'medium', price: 2200 },
      { label: 'large', price: 2500 },
    ],
  },
  {
    name: 'Hot Chocolate',
    category: 'Beverage',
    description: 'Velvety cocoa with whipped finish.',
    imageUrl: '/images/hot_chocolate.jpeg',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 1700 },
      { label: 'medium', price: 2000 },
      { label: 'large', price: 2300 },
    ],
  },
  {
    name: 'Black Tea',
    category: 'Tea',
    description: 'Classic black tea with deep aroma.',
    imageUrl: '/images/black_tea.png',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 1200 },
      { label: 'medium', price: 1400 },
      { label: 'large', price: 1600 },
    ],
  },
  {
    name: 'Green Tea',
    category: 'Tea',
    description: 'Light, refreshing, and subtly floral.',
    imageUrl: '/images/green_tea.jpeg',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 1200 },
      { label: 'medium', price: 1400 },
      { label: 'large', price: 1600 },
    ],
  },
  {
    name: 'Herbal Tea',
    category: 'Tea',
    description: 'Herb blend to relax and reset.',
    imageUrl: '/images/herbal_tea.jpg',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 1300 },
      { label: 'medium', price: 1500 },
      { label: 'large', price: 1700 },
    ],
  },
  {
    name: 'Lemonade',
    category: 'Beverage',
    description: 'Bright citrus with a sweet finish.',
    imageUrl: '/images/lemonade.jpeg',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 1500 },
      { label: 'medium', price: 1800 },
      { label: 'large', price: 2100 },
    ],
  },
  {
    name: 'Brownie',
    category: 'Dessert',
    description: 'Fudgy chocolate square with crisp edges.',
    imageUrl: '/images/brownie.jpeg',
    isAvailable: true,
    basePrice: 1600,
  },
  {
    name: 'Cheesecake',
    category: 'Dessert',
    description: 'Creamy cheesecake with a delicate crust.',
    imageUrl: '/images/cheesecake.jpeg',
    isAvailable: true,
    basePrice: 1900,
  },
  {
    name: 'Croissant',
    category: 'Dessert',
    description: 'Buttery layers baked fresh every morning.',
    imageUrl: '/images/croissant.jpeg',
    isAvailable: true,
    basePrice: 1500,
  },
  {
    name: 'Muffin',
    category: 'Dessert',
    description: 'Soft crumb muffin with seasonal berries.',
    imageUrl: '/images/muffin.jpeg',
    isAvailable: true,
    basePrice: 1500,
  },
  {
    name: 'Cinnamon Roll',
    category: 'Dessert',
    description: 'Warm cinnamon swirl with glaze.',
    imageUrl: '/images/cinnamon_roll.jpeg',
    isAvailable: true,
    basePrice: 1700,
  },
  {
    name: 'Pumpkin Macchiato',
    category: 'Seasonal',
    description: 'Autumn spice with pumpkin sweetness.',
    imageUrl: '/images/pumpkin_macchiato.jpeg',
    isAvailable: true,
    sizes: [
      { label: 'small', price: 2200 },
      { label: 'medium', price: 2500 },
      { label: 'large', price: 2800 },
    ],
  },
  {
    name: 'Caramel Apple Pie',
    category: 'Seasonal Dessert',
    description: 'Warm apple pie with caramel drizzle.',
    imageUrl: '/images/caramel_apple_pie.jpeg',
    isAvailable: true,
    basePrice: 2100,
  },
];

const seed = async () => {
  try {
    await connectDB();
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
