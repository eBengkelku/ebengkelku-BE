// Product-specific validation messages with i18n support
export const ProductValidationMessages = {
  name: {
    required: 'products.validation.name.required',
    string: 'products.validation.name.string',
    length: 'products.validation.name.length',
  },
  description: {
    string: 'products.validation.description.string',
    maxLength: 'products.validation.description.maxLength',
  },
  price: {
    number: 'products.validation.price.number',
    min: 'products.validation.price.min',
  },
  stock_quantity: {
    number: 'products.validation.stock_quantity.number',
    min: 'products.validation.stock_quantity.min',
  },
  category: {
    string: 'products.validation.category.string',
    maxLength: 'products.validation.category.maxLength',
  },
};
