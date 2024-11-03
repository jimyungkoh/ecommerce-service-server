import {
  CartItemModel,
  CartModel,
  ProductStockModel,
  UserModel,
} from 'src/domain/models';

export const cartServiceFixture = () => {
  const userId = 1;
  const user = new UserModel({
    id: userId,
    email: 'test@email.com',
    password: 'password',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const cart = new CartModel({
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

  const cartItem = new CartItemModel(cartItemParams);

  const productStockParams = {
    productId: 1,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const productStock = new ProductStockModel(productStockParams);

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
