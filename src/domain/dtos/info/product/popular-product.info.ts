import {
  PopularProductDomain,
  PopularProductDomainProps,
} from 'src/infrastructure/dtos/domains';
import { InfoDTO } from '../info';

export type PopularProductInfoProps = PopularProductDomainProps;

export class PopularProductInfo extends InfoDTO<PopularProductInfoProps> {
  constructor(props: PopularProductInfoProps) {
    super(props);
  }

  get id(): number {
    return this.props.id;
  }

  get productId(): number {
    return this.props.productId;
  }

  get salesCount(): number {
    return this.props.salesCount;
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
