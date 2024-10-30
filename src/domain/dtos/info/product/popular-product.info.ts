import {
  PopularProductDomain,
  PopularProductDomainProps,
} from 'src/infrastructure/dtos/domains';

export type PopularProductInfoProps = PopularProductDomainProps;

export class PopularProductInfo {
  constructor(private readonly props: PopularProductInfoProps) {}

  get id(): string {
    return this.props.id.toString();
  }

  get productId(): string {
    return this.props.productId.toString();
  }

  get salesCount(): string {
    return this.props.salesCount.toString();
  }

  get aggregationDate(): Date {
    return this.props.aggregationDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static from(domain: PopularProductDomain): PopularProductInfo {
    return new PopularProductInfo(domain);
  }

  static fromList(domains: PopularProductDomain[]): PopularProductInfo[] {
    return domains.map((domain) => new PopularProductInfo(domain));
  }
}
