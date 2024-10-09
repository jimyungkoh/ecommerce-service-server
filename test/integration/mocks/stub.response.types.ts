export type StubUserResponseType = {
  id: number;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StubBalanceResponseType = {
  userId: number;
  amount: number;
  updatedAt: Date;
};

export type StubProductResponseType = {
  id: number;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export type StubOrderResponseType = {
  id: number;
  userId: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  orderItems: StubOrderItemResponseType[];
};

export type StubOrderItemResponseType = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
};

export type StubCartResponseType = {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type StubCartItemResponseType = {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
};

export type StubPopularProductResponseType = {
  id: number;
  productId: number;
  sales: number;
  date: Date;
};
