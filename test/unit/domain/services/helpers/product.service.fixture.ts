import { ProductModel, ProductStockModel } from 'src/domain/models';

export const productServiceFixture = () => {
  const productId = 1;
  const product = new ProductModel({
    id: productId,
    name: 'Product 1',
    price: 100_000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const stock = new ProductStockModel({
    productId: productId,
    stock: 1_000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { productId, product, stock };
};
