import Decimal from 'decimal.js';
import {
  ProductDomain,
  ProductStockDomain,
  SearchedProductDomain,
} from 'src/infrastructure/dtos/domains';

export const productServiceFixture = () => {
  const productId = BigInt(1);
  const product = new ProductDomain({
    id: productId,
    name: 'Product 1',
    price: new Decimal(100_000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const stock = new ProductStockDomain({
    productId: productId,
    stock: 1_000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const searchResult = new SearchedProductDomain({
    id: productId,
    name: 'Product 1',
    price: new Decimal(100_000),
    stock: 1_000,
  });

  return { productId, product, stock, searchResult };
};
