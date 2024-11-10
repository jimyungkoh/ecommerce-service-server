import {
  PopularProductModel,
  PopularProductModelProps,
} from 'src/domain/models';

export type PopularProductInfoProps = PopularProductModelProps;

export class PopularProductInfo {
  readonly id: number;
  readonly productId: number;
  readonly salesCount: number;
  readonly aggregationDate: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: PopularProductInfoProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.salesCount = props.salesCount;
    this.aggregationDate = props.aggregationDate;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static from(domain: PopularProductModel): PopularProductInfo {
    return new PopularProductInfo(domain);
  }

  static fromList(domains: PopularProductModel[]): PopularProductInfo[] {
    return domains.map((domain) => new PopularProductInfo(domain));
  }
}
