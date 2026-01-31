require('dotenv').config();
const connectDB = require('../config/db');
const { Product } = require('../models/Product');

const imageMap = {
  Americano: '/images/americano.jpeg',
  Cappuccino: '/images/cappuccino.jpeg',
  Espresso: '/images/espresso.jpg',
  Latte: '/images/latte.jpeg',
  'Iced Latte': '/images/iced_latte.jpeg',
  'Hot Chocolate': '/images/hot_chocolate.jpeg',
  'Black Tea': '/images/black_tea.png',
  'Green Tea': '/images/green_tea.jpeg',
  'Herbal Tea': '/images/herbal_tea.jpg',
  Lemonade: '/images/lemonade.jpeg',
  Brownie: '/images/brownie.jpeg',
  Cheesecake: '/images/cheesecake.jpeg',
  Croissant: '/images/croissant.jpeg',
  Muffin: '/images/muffin.jpeg',
  'Cinnamon Roll': '/images/cinnamon_roll.jpeg',
  Croissant: '/images/croissant.jpeg',
  'Pumpkin Macchiato': '/images/pumpkin_macchiato.jpeg',
  'Caramel Apple Pie': '/images/caramel_apple_pie.jpeg',
};

const run = async () => {
  try {
    await connectDB();
    const updates = Object.entries(imageMap).map(([name, imageUrl]) =>
      Product.updateOne({ name }, { $set: { imageUrl } })
    );
    await Promise.all(updates);
    console.log('Product images updated.');
    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }
};

run();
