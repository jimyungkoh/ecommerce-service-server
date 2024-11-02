import {
  CartDomain,
  CartItemDomain,
  ProductStockDomain,
  UserDomain,
} from 'src/infrastructure/dtos/domains';

export const cartServiceFixture = () => {
  const userId = 1;
  const user = new UserDomain({
    id: userId,
    email: 'test@email.com',
    password: 'password',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const cart = new CartDomain({
    id: 1,
    userId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const cartItemParams = {
    id: 1,
    cartId: cart.id,
    productId: 1,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const cartItem = new CartItemDomain(cartItemParams);

  const productStockParams = {
    productId: 1,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const productStock = new ProductStockDomain(productStockParams);

  return {
    userId,
    user,
    cart,
    cartItem,
    productStock,
    cartItemParams,
    productStockParams,
  };
};
