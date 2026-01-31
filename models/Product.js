const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ['small', 'medium', 'large'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    basePrice: {
      type: Number,
      min: 0,
    },
    sizes: {
      type: [sizeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  Product: mongoose.model('Product', productSchema),
};
