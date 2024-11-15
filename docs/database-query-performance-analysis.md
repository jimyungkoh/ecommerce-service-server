## 목차
1. [개요](#개요)
  - 분석 배경
  - 참고 시나리오

2. [검색 시나리오](#검색-시나리오)
  - [2.1 데이터 특성](#데이터-특성)
  - [2.2 사용자 행동 패턴](#사용자-행동-패턴)

3. [성능 최적화 전략](#성능-최적화-전략)
  - [3.1 신상품순 조회 최적화](#신상품순-조회-최적화)
    - 데이터 특성 분석
    - 인덱스 전략
    - 성능 개선 효과
    - 실행 계획 분석

  - [3.2 가격순 조회 최적화](#가격순-조회-최적화)
    - 데이터 특성 분석
    - 인덱스 전략
    - 성능 개선 효과
    - 실행 계획 분석

  - [3.3 판매순 조회 최적화](#판매순-조회-최적화)
    - 데이터 특성 분석
    - 인덱스 전략
    - 성능 개선 효과
    - 실행 계획 분석

4. [결론](#결론)

## 개요
대규모 상품 데이터베이스(1,000만 건)의 검색 성능 최적화를 위한 인덱스 전략과 그 효과를 분석합니다.

신상품순, 가격순, 판매량(일별/주간/월간/3개월/1년)순이라는 세 가지 상품 검색 시나리오 분석을 진행했습니다.

<figure>
  <center>
    <img src="https://i.imgur.com/Mpjavp1.png">
    <figcaption>참고 시나리오: 무신사 상품 조회</figcaption>
  </center>
</figure>

## 검색 시나리오

### 데이터 특성
- **데이터 규모**: 1,000만 건의 상품 데이터
- **페이지네이션**: 20건 단위 조회 (프론트엔드 api 요청시 일반적인 데이터 사이즈)
- **주요 정렬 기준**:
  - 신상품순 정렬 - 상품 수정일(updated_at)
  - 가격순 정렬 -  가격(price)
  - 인기 상품순 정렬- 집계 일자(aggregation_date), 판매량(sales_count) 등..

### 사용자 행동 패턴
- 최신 상품 조회
- 가격대별 상품 탐색
- 기간별로 상품 검색

| 상품 유형   | 주요 검색 패턴 |
| ------- | -------- |
| 트렌드성 상품 | 일간/주간/월간 |
| 가전/디지털  | 분기/연간    |
| 시즌성 상품  | 월간/분기별   |
## 성능 최적화 전략

### 신상품 순 조회 최적화
#### (1) 상품 수정일의 데이터 특성 분석
- **카디널리티**: 1.0000 (매우 높음)
- 데이터 시딩 기준: (2010-01-01 ~ 현재)까지의 기간; 밀리초[datetime(3)] 단위
- **특징**: 각 상품의 수정 시간이 거의 유일한 값을 가짐
- **성능 영향**: 높은 카디널리티로 인해 인덱스 효율성 극대화 예상

#### (2) 인덱스 전략
```sql
CREATE INDEX idx_product_updated_at ON product (updated_at);
```
- **선정 이유**:
  - 높은 카디널리티로 인한 효과적인 데이터 구분
  - ORDER BY 절의 정렬 연산 최적화
  - LIMIT 절과의 시너지 효과

#### (3) 성능 개선 효과
- **개선 전**: 5.01초
- **개선 후**: 0.000154초
- **개선율**: 99.997%
- **실행 계획 변화**:
  - 개선 전: Table Scan → Sort → Limit
  - 개선 후: Index Scan → Limit

#### (4) 실행 계획 및 성능 분석 상세

##### 인덱스 적용 전
```sql
# 쿼리 실행 계획 및 성능 분석
EXPLAIN  ANALYZE  
SELECT *  
FROM product  
ORDER BY product.updated_at;

------ 결과 ------
-> Limit: 20 row(s)  (cost=1.05e+6 rows=20) (actual time=5007..5007 rows=20 loops=1)
    -> Sort: product.updated_at, limit input to 20 row(s) per chunk  (cost=1.05e+6 rows=9.94e+6) (actual time=5007..5007 rows=20 loops=1)
        -> Table scan on product  (cost=1.05e+6 rows=9.94e+6) (actual time=1.47..3944 rows=10e+6 loops=1)

쿼리 소요 시간: 5.01초
```

##### 인덱스 적용 후
```sql
# 인덱스 생성
CREATE INDEX idx_product_updated_at ON product (updated_at);

# 쿼리 실행 계획 및 성능 분석
EXPLAIN  ANALYZE  
SELECT *  
FROM product  
ORDER BY product.updated_at  
LIMIT 20 OFFSET 0;

------ 결과 ------
-> Limit: 20 row(s)  (cost=0.121 rows=20) (actual time=0.0687..0.154 rows=20 loops=1)
    -> Index scan on product using idx_product_updated_at  (cost=0.121 rows=20) (actual time=0.0676..0.151 rows=20 loops=1)

쿼리 소요 시간: 0.000154초
```


### 가격순 조회 최적화
#### (1) 가격 데이터 특성 분석
- **카디널리티**: 0.0100 (낮음)
- **값 범위**: 1,000원 ~ 10,000,000원 (100원 단위)
- **성능 영향**: 낮은 카디널리티로 인한 제한적 효과 예상

#### (2) 인덱스 전략
```sql
CREATE INDEX idx_product_price ON product (price);
```
- **선정 이유**:
  - LIMIT 20 조건으로 인한 부분 스캔 최적화
  - 양방향 정렬(ASC/DESC) 지원 필요
  - 향후 가격 범위 검색 지원 가능

#### (3) 성능 개선 효과
- **개선 전**: 8.22초
- **개선 후**: 0.015초
- **개선율**: 99.817%
- **실행 계획 변화**:
  - 개선 전: Table Scan → Sort → Limit
  - 개선 후: Index Scan → Limit

#### (4) 실행 계획 및 성능 분석 상세
##### 인덱스 적용 전
```sql
# 쿼리 실행 계획 및 성능 분석
EXPLAIN  ANALYZE  
SELECT *  
FROM product  
ORDER BY product.price  
LIMIT 20 OFFSET 0;

------ 결과 ------
-> Limit: 20 row(s)  (cost=1.05e+6 rows=20) (actual time=8220..8220 rows=20 loops=1)
    -> Sort: product.price, limit input to 20 row(s) per chunk  (cost=1.05e+6 rows=9.94e+6) (actual time=8220..8220 rows=20 loops=1)
        -> Table scan on product  (cost=1.05e+6 rows=9.94e+6) (actual time=3.5..6231 rows=10e+6 loops=1)

쿼리 소요 시간: 8.22초
```

##### 인덱스 적용 후
```sql
# 인덱스 생성
CREATE INDEX idx_product_price ON product (price);  

# 쿼리 실행 계획 및 성능 분석

## 가격 낮은순 조회
EXPLAIN ANALYZE  
SELECT *  
FROM product  
ORDER BY product.price  
LIMIT 20 OFFSET 0;

------ 결과: 가격 낮은순 조회 ------
-> Limit: 20 row(s)  (cost=0.121 rows=20) (actual time=6.79..14.9 rows=20 loops=1)
    -> Index scan on product using idx_product_price  (cost=0.121 rows=20) (actual time=6.79..14.9 rows=20 loops=1)

쿼리 소요 시간: 0.015초

## 가격 높은순 조회
EXPLAIN ANALYZE  
SELECT *  
FROM product  
ORDER BY product.price DESC  
LIMIT 20 OFFSET 0;

------ 결과: 가격 높은순 조회 ------
-> Limit: 20 row(s)  (cost=0.121 rows=20) (actual time=4.36..13.7 rows=20 loops=1)
    -> Index scan on product using idx_product_price (reverse)  (cost=0.121 rows=20) (actual time=4.33..13.7 rows=20 loops=1)

쿼리 소요 시간: 0.014초
```

### 판매순 조회 최적화
#### (1) 데이터 특성 분석
- **단일 컬럼 카디널리티**
  - sales_count: 0.0000 (매우 낮음) - 판매량이 많이 중복됨
  - aggregation_date: 0.0000 (매우 낮음) - 날짜가 많이 중복됨
  - product_id: 0.0027 (낮음) - 상품별 여러 레코드 존재
- **복합 카디널리티**
  - sales_count + date: 0.0000 (매우 낮음)
  - sales_count + product_id: 0.9737 (매우 높음)
  - date + product_id: 1.0000 (완벽한 고유성)
  - 전체 조합: 1.0000 (완벽한 고유성)
- **쿼리 실행 순서 기반 분석**
```SQL
# 의사 코드
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date BETWEEN ${startDate} AND ${endDate}
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20

1. FROM: popular_product 테이블 접근
2. WHERE: aggregation_date = CURDATE() - INTERVAL 1 DAY 조건으로 필터링
3. GROUP BY: product_id로 그룹화하며 SUM(sales_count) 집계
4. SELECT: product_id와 집계된 total_sales 선택
5. ORDER BY: total_sales DESC로 정렬
6. LIMIT: 상위 20개 행만 선택
```

#### (2) 인덱스 전략
```sql
CREATE INDEX idx_pp_date_pid_sales  
    ON popular_product (aggregation_date, product_id, sales_count);
```

- **선정 이유**:
  - `aggregation_date`:
    - WHERE 절의 기간 필터링 첫 진입점
    - 범위 검색(BETWEEN)에 효과적

  - `product_id`:
    - date + product_id 조합의 카디널리티(1.0000) 활용
    - GROUP BY 연산의 정렬 비용 절감

  - `sales_count`:
    - SUM 집계를 위한 커버링 인덱스
    - 인덱스 자체에서 판매량 집계 가능

- **기대 효과**:
  - WHERE 절의 날짜 범위 검색이 인덱스를 통해 빠르게 처리
  - GROUP BY의 추가 정렬 작업 불필요
  - 테이블 접근 없이 인덱스에서 모든 작업 수행 가능

#### (3) 성능 개선 효과

![](https://i.imgur.com/laTBlW8.png)

실행 계획 변화:
1. **단기 조회 (일/주간)**
  - 개선 전: Index lookup → Aggregate temp table → Table scan → Sort → Limit
  - 개선 후: Covering index scan → Group aggregate → Sort → Limit
  - 주요 변화: 모든 필요 데이터가 인덱스에 포함되어 임시 테이블 생성 단계 제거
2. **중장기 조회 (월/분기)**
  - 개선 전: Table scan → Filter → Aggregate temp table → Sort → Limit
  - 개선 후: Covering index scan → Filter → Aggregate temp table → Sort → Limit
  - 주요 변화: Full table scan이 Covering index scan으로 변경
3. **장기 조회 (연간)**
  - 개선 전: Table scan (9.12M rows) → Filter → Aggregate temp table → Sort → Limit
  - 개선 후: Covering index scan (9.12M rows) → Filter → Aggregate temp table → Sort → Limit
  - 주요 변화: 대용량 데이터에서는 인덱스 사용이 오히려 부하 유발

기간별 조회 성능 분석:
- 단기 데이터(~1개월) 조회 시 80% 이상의 뛰어난 성능 개선
- 중기 데이터(3개월) 조회 시 50% 이상의 양호한 성능 개선
- 장기 데이터(1년) 조회 시 오히려 성능 저하
- 데이터량이 증가할수록 개선 효과 감소
- 900만 건 이상의 대용량 데이터는 별도의 집계 테이블 도입 검토 필요

#### (4) 실행 계획 및 성능 분석 상세

##### 인덱스 적용 전
```sql
-- 1. 일별 인기 상품 (최근 1일)  
EXPLAIN ANALYZE  
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date = CURDATE() - INTERVAL 1 DAY  
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20;  

------ 결과: 일별 인기 상품 조회 ------
-> Limit: 20 row(s)  (actual time=194..194 rows=20 loops=1)
    -> Sort: total_sales DESC, limit input to 20 row(s) per chunk  (actual time=194..194 rows=20 loops=1)
        -> Table scan on <temporary>  (actual time=189..191 rows=25000 loops=1)
            -> Aggregate using temporary table  (actual time=189..189 rows=25000 loops=1)
                -> Index lookup on popular_product using idx_popular_product_aggregation_date (aggregation_date=(curdate() - interval 1 day))  (cost=40305 rows=43008) (actual time=46.6..181 rows=25000 loops=1)
                
쿼리 소요 시간: 0.194초

-- 2. 주간 인기 상품 (최근 1주일)  
EXPLAIN ANALYZE  
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE() - INTERVAL 1 DAY  
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20;

------ 결과: 주간 인기 상품 조회 ------
-> Limit: 20 row(s)  (actual time=1069..1069 rows=20 loops=1)
    -> Sort: total_sales DESC, limit input to 20 row(s) per chunk  (actual time=1069..1069 rows=20 loops=1)
        -> Table scan on <temporary>  (actual time=1064..1066 rows=25000 loops=1)
            -> Aggregate using temporary table  (actual time=1064..1064 rows=25000 loops=1)
                -> Index range scan on popular_product using idx_popular_product_aggregation_date over ('2024-11-08' <= aggregation_date <= '2024-11-14'), with index condition: (popular_product.aggregation_date between <cache>((curdate() - interval 7 day)) and <cache>((curdate() - interval 1 day)))  (cost=297806 rows=312606) (actual time=22.1..987 rows=175000 loops=1)

쿼리 소요 시간: 1.069초
  
-- 3. 월간 인기 상품 (최근 1개월)  
EXPLAIN ANALYZE  
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date BETWEEN CURDATE() - INTERVAL 1 MONTH AND CURDATE() - INTERVAL 1 DAY  
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20;

------ 결과: 월간 인기 상품 조회 ------
-> Limit: 20 row(s)  (actual time=2626..2626 rows=20 loops=1)
    -> Sort: total_sales DESC, limit input to 20 row(s) per chunk  (actual time=2626..2626 rows=20 loops=1)
        -> Table scan on <temporary>  (actual time=2621..2623 rows=25000 loops=1)
            -> Aggregate using temporary table  (actual time=2621..2621 rows=25000 loops=1)
                -> Filter: (popular_product.aggregation_date between <cache>((curdate() - interval 1 month)) and <cache>((curdate() - interval 1 day)))  (cost=916638 rows=1.36e+6) (actual time=2.49..2419 rows=775000 loops=1)
                    -> Table scan on popular_product  (cost=916638 rows=8.89e+6) (actual time=2.48..2053 rows=9.12e+6 loops=1)

쿼리 소요 시간: 2.626초
  
-- 4. 3개월 인기 상품  
EXPLAIN ANALYZE  
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date BETWEEN CURDATE() - INTERVAL 3 MONTH AND CURDATE() - INTERVAL 1 DAY  
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20;  

------ 결과: 분기 인기 상품 조회 ------
-> Limit: 20 row(s)  (actual time=3051..3051 rows=20 loops=1)
    -> Sort: total_sales DESC, limit input to 20 row(s) per chunk  (actual time=3051..3051 rows=20 loops=1)
        -> Table scan on <temporary>  (actual time=3046..3048 rows=25000 loops=1)
            -> Aggregate using temporary table  (actual time=3046..3046 rows=25000 loops=1)
                -> Filter: (popular_product.aggregation_date between <cache>((curdate() - interval 3 month)) and <cache>((curdate() - interval 1 day)))  (cost=915406 rows=4.05e+6) (actual time=1.2..2469 rows=2.3e+6 loops=1)
                    -> Table scan on popular_product  (cost=915406 rows=8.89e+6) (actual time=1.19..2061 rows=9.12e+6 loops=1)

쿼리 소요 시간: 3.051초

-- 5. 최근 1년 인기 상품  
EXPLAIN ANALYZE  
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date BETWEEN CURDATE() - INTERVAL 1 YEAR AND CURDATE() - INTERVAL 1 DAY  
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20;

------ 결과: 최근 1년 인기 상품 조회 ------
-> Limit: 20 row(s)  (actual time=4845..4845 rows=20 loops=1)
    -> Sort: total_sales DESC, limit input to 20 row(s) per chunk  (actual time=4845..4845 rows=20 loops=1)
        -> Table scan on <temporary>  (actual time=4840..4842 rows=25000 loops=1)
            -> Aggregate using temporary table  (actual time=4840..4840 rows=25000 loops=1)
                -> Filter: (popular_product.aggregation_date between <cache>((curdate() - interval 1 year)) and <cache>((curdate() - interval 1 day)))  (cost=915406 rows=4.44e+6) (actual time=1.68..2631 rows=9.12e+6 loops=1)
                    -> Table scan on popular_product  (cost=915406 rows=8.89e+6) (actual time=1.67..2029 rows=9.12e+6 loops=1)

쿼리 소요 시간: 4.845초
```


##### 인덱스 적용 후
```sql
CREATE INDEX idx_pp_date_pid_sales  
    ON popular_product (aggregation_date, product_id, sales_count);

-- 1. 일별 인기 상품 (최근 1일)  
EXPLAIN ANALYZE  
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date = CURDATE() - INTERVAL 1 DAY  
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20;  

------ 결과: 일별 인기 상품 조회 ------
-> Limit: 20 row(s)  (actual time=22.6..22.6 rows=20 loops=1)
    -> Sort: total_sales DESC, limit input to 20 row(s) per chunk  (actual time=22.6..22.6 rows=20 loops=1)
        -> Stream results  (cost=9962 rows=2981) (actual time=1.13..17.9 rows=25000 loops=1)
            -> Group aggregate: sum(popular_product.sales_count)  (cost=9962 rows=2981) (actual time=1.13..13.9 rows=25000 loops=1)
                -> Covering index lookup on popular_product using idx_pp_date_pid_sales (aggregation_date=(curdate() - interval 1 day))  (cost=5062 rows=49000) (actual time=1.12..8.87 rows=25000 loops=1)
                
쿼리 소요 시간: 0.0226초

-- 2. 주간 인기 상품 (최근 1주일)  
EXPLAIN ANALYZE  
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE() - INTERVAL 1 DAY  
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20;

------ 결과: 주간 인기 상품 조회 ------
-> Limit: 20 row(s)  (actual time=124..124 rows=20 loops=1)
    -> Sort: total_sales DESC, limit input to 20 row(s) per chunk  (actual time=124..124 rows=20 loops=1)
        -> Table scan on <temporary>  (actual time=119..121 rows=25000 loops=1)
            -> Aggregate using temporary table  (actual time=119..119 rows=25000 loops=1)
                -> Filter: (popular_product.aggregation_date between <cache>((curdate() - interval 7 day)) and <cache>((curdate() - interval 1 day)))  (cost=70949 rows=349000) (actual time=2.14..60.3 rows=175000 loops=1)
                    -> Covering index range scan on popular_product using idx_pp_date_pid_sales over ('2024-11-08' <= aggregation_date <= '2024-11-14')  (cost=70949 rows=349000) (actual time=2.12..47.3 rows=175000 loops=1)

쿼리 소요 시간: 0.124초
  
-- 3. 월간 인기 상품 (최근 1개월)  
EXPLAIN ANALYZE  
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date BETWEEN CURDATE() - INTERVAL 1 MONTH AND CURDATE() - INTERVAL 1 DAY  
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20;

------ 결과: 월간 인기 상품 조회 ------
-> Limit: 20 row(s)  (actual time=471..471 rows=20 loops=1)
    -> Sort: total_sales DESC, limit input to 20 row(s) per chunk  (actual time=471..471 rows=20 loops=1)
        -> Table scan on <temporary>  (actual time=466..468 rows=25000 loops=1)
            -> Aggregate using temporary table  (actual time=466..466 rows=25000 loops=1)
                -> Filter: (popular_product.aggregation_date between <cache>((curdate() - interval 1 month)) and <cache>((curdate() - interval 1 day)))  (cost=314896 rows=1.55e+6) (actual time=1.08..239 rows=775000 loops=1)
                    -> Covering index range scan on popular_product using idx_pp_date_pid_sales over ('2024-10-15' <= aggregation_date <= '2024-11-14')  (cost=314896 rows=1.55e+6) (actual time=1.07..185 rows=775000 loops=1)

쿼리 소요 시간: 0.471초
  
-- 4. 3개월 인기 상품  
EXPLAIN ANALYZE  
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date BETWEEN CURDATE() - INTERVAL 3 MONTH AND CURDATE() - INTERVAL 1 DAY  
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20;  

------ 결과: 분기 인기 상품 조회 ------
-> Limit: 20 row(s)  (actual time=1354..1354 rows=20 loops=1)
    -> Sort: total_sales DESC, limit input to 20 row(s) per chunk  (actual time=1354..1354 rows=20 loops=1)
        -> Table scan on <temporary>  (actual time=1349..1351 rows=25000 loops=1)
            -> Aggregate using temporary table  (actual time=1349..1349 rows=25000 loops=1)
                -> Filter: (popular_product.aggregation_date between <cache>((curdate() - interval 3 month)) and <cache>((curdate() - interval 1 day)))  (cost=844465 rows=4.15e+6) (actual time=1.69..674 rows=2.3e+6 loops=1)
                    -> Covering index range scan on popular_product using idx_pp_date_pid_sales over ('2024-08-15' <= aggregation_date <= '2024-11-14')  (cost=844465 rows=4.15e+6) (actual time=1.66..516 rows=2.3e+6 loops=1)

쿼리 소요 시간: 1.354초

-- 5. 최근 1년 인기 상품  
EXPLAIN ANALYZE  
SELECT  
    product_id,  
    SUM(sales_count) as total_sales  
FROM popular_product  
WHERE aggregation_date BETWEEN CURDATE() - INTERVAL 1 YEAR AND CURDATE() - INTERVAL 1 DAY  
GROUP BY product_id  
ORDER BY total_sales DESC  
LIMIT 20;

------ 결과: 최근 1년 인기 상품 조회 ------
-> Limit: 20 row(s)  (actual time=5143..5143 rows=20 loops=1)
    -> Sort: total_sales DESC, limit input to 20 row(s) per chunk  (actual time=5143..5143 rows=20 loops=1)
        -> Table scan on <temporary>  (actual time=5138..5140 rows=25000 loops=1)
            -> Aggregate using temporary table  (actual time=5138..5138 rows=25000 loops=1)
                -> Filter: (popular_product.aggregation_date between <cache>((curdate() - interval 1 year)) and <cache>((curdate() - interval 1 day)))  (cost=903156 rows=4.44e+6) (actual time=1.32..2648 rows=9.12e+6 loops=1)
                    -> Covering index range scan on popular_product using idx_pp_date_pid_sales over ('2023-11-15' <= aggregation_date <= '2024-11-14')  (cost=903156 rows=4.44e+6) (actual time=1.3..2034 rows=9.12e+6 loops=1)

쿼리 소요 시간: 5.143초
```

## 결론
이번 성능 최적화 분석을 통해, 이커머스 서비스에서 상품 검색의 속도가 어떻게 사용자 경험을 좌우하는지 명확하게 확인할 수 있었습니다.

1,000만 건이라는 대규모 데이터에서 수 초가 걸리던 검색이 밀리초 단위로 개선되는 과정은, 단순한 숫자의 변화가 아닌 빠른 주문 처리로 이커머스 비즈니스에 더 많은 매출 기회를 창출할 수 있음을 의미합니다.

하지만, 한계점도 발견했습니다. 최근 1년 판매량(1년치 데이터; 900만 건 이상)순 조회에서는 인덱스 적용이 오히려 역효과를 낳았습니다.

인덱스 적용 전:
```sql
-> Table scan on popular_product
   (actual time=1.67..2029 rows=9.12e+6 loops=1)
총 실행 시간: 4.845초
```

인덱스 적용 후:
```sql
-> Covering index range scan on popular_product using idx_pp_date_pid_sales
   (actual time=1.3..2034 rows=9.12e+6 loops=1)
총 실행 시간: 5.143초
```

1년치 데이터 조회 시 날짜 범위가 넓어 인덱스의 장점(선택성)을 상실하기 때문에, 연간 매출 상위 상품을 실시간으로 보여주기 위해서는 '실시간 집계 방식을 개선할 필요성'이 있었습니다.

이를 위해 집계 테이블 도입, 데이터 파티셔닝, 캐싱 전략 등 새로운 접근 방식을 검토하기로 했습니다.

