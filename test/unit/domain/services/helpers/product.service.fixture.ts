import {
  ProductDomain,
  ProductStockDomain,
} from 'src/infrastructure/dtos/domains';

export const productServiceFixture = () => {
  const productId = 1;
  const product = new ProductDomain({
    id: productId,
    name: 'Product 1',
    price: 100_000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const stock = new ProductStockDomain({
    productId: productId,
    stock: 1_000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { productId, product, stock };
};
