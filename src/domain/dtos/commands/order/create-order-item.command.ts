export class CreateOrderItemCommand {
  productId: number;
  quantity: number;
  price: number;

  constructor(
    product: { id: number; price: number },
    orderItem: { quantity: number },
  ) {
    this.productId = product.id;
    this.quantity = orderItem.quantity;
    this.price = product.price;
  }
}
