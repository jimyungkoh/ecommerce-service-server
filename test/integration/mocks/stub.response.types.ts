type BaseResponse = {
  id: number;
  createdAt: string;
  updatedAt: string;
};

export type UserResponse = BaseResponse & {
  email: string;
};

export type BalanceResponse = {
  userId: number;
  amount: number;
  updatedAt: string;
};

export type ProductResponse = BaseResponse & {
  name: string;
  price: number;
};

export type OrderResponse = BaseResponse & {
  userId: number;
  totalAmount: number;
  orderItems: OrderItemResponse[];
};

export type OrderItemResponse = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
};

export type CartResponse = BaseResponse & {
  userId: number;
};

export type CartItemResponse = {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
};

export type PopularProductResponse = {
  id: number;
  productId: number;
  sales: number;
  date: string;
};
