# API 명세서

* 이 API 명세서는 제공된 Mock API를 기반으로 작성되었습니다.
  * Mock API는 유저 로그인(유효한 토큰으로 인증처리가 완료된) 상태라고 가정합니다.
  * Mock API는 성공 케이스만을 응답합니다.
* 실제 구현 시 인증, 에러 처리, 페이지네이션 등의 추가적인 기능이 구현될 예정입니다.

## 1. 잔액 충전 / 조회 API

### 1.1 잔액 충전

* **Endpoint**: POST /balance/charge
* **설명**: 사용자 토큰 및 충전할 금액을 받아 잔액을 충전합니다.
* **요청 본문**:

  ```json
  {
    "amount": number
  }
  ```

* **응답**:
  * 상태 코드: 201 Created

  ```json
  {
    "success": true,
    "data": {
      "balance": {
        "userId": number,
        "amount": number,
        "updatedAt": string (ISO 8601 format)
      }
    },
    "message": null
  }
  ```

### 1.2 잔액 조회

* **Endpoint**: GET /balance
* **설명**: 사용자 토큰을 통해 해당 사용자의 잔액을 조회합니다.
* **응답**:
  * 상태 코드: 200 OK

  ```json
  {
    "success": true,
    "data": {
      "balance": {
        "userId": number,
        "amount": number,
        "updatedAt": string (ISO 8601 format)
      }
    },
    "message": null
  }
  ```

## 2. 상품 조회 API

### 2.1 상품 목록 조회

* **Endpoint**: GET /products
* **설명**: 상품 정보 (ID, 이름, 가격)을 조회합니다.
* **응답**:
  * 상태 코드: 200 OK

  ```json
  {
    "success": true,
    "data": {
      "products": [
        {
          "id": number,
          "name": string,
          "price": number,
          "createdAt": string (ISO 8601 format),
          "updatedAt": string (ISO 8601 format)
        }
      ],
      "totalPages": number,
      "currentPage": number
    },
    "message": null
  }
  ```

### 2.2 인기 판매 상품 조회

* **Endpoint**: GET /products/top
* **설명**: 최근 3일간 가장 많이 팔린 상위 5개 상품 정보를 제공합니다.
* **응답**:
  * 상태 코드: 200 OK

  ```json
  {
    "success": true,
    "data": {
      "topProducts": [
        {
          "id": number,
          "productId": number,
          "sales": number,
          "date": string (ISO 8601 format)
        }
      ]
    },
    "message": null
  }
  ```

## 3. 주문 / 결제 API

### 3.1 주문 생성

* **Endpoint**: POST /orders
* **설명**: 사용자 토큰과 (상품 ID, 수량) 목록을 입력받아 주문하고 결제를 수행합니다.
* **요청 본문**:

  ```json
  {
    "items": [
      {
        "productId": number,
        "quantity": number
      }
    ]
  }
  ```

* **응답**:
  * 상태 코드: 201 Created

  ```json
  {
    "success": true,
    "data": {
      "order": {
        "id": number,
        "userId": number,
        "totalAmount": number,
        "createdAt": string (ISO 8601 format),
        "updatedAt": string (ISO 8601 format),
        "orderItems": [
          {
            "id": number,
            "orderId": number,
            "productId": number,
            "quantity": number,
            "price": number
          }
        ]
      }
    },
    "message": null
  }
  ```

## 4. 장바구니 관리

### 4.1 장바구니 상품 추가

* **Endpoint**: POST /cart
* **설명**: 사용자가 관심 있는 상품을 장바구니에 추가합니다.
* **요청 본문**:

  ```json
  {
    "productId": number,
    "quantity": number
  }
  ```

* **응답**:
  * 상태 코드: 201 Created

  ```json
  {
    "success": true,
    "data": {
      "id": number,
      "cartId": number,
      "productId": number,
      "quantity": number
    },
    "message": null
  }
  ```

### 4.2 장바구니 상품 삭제

* **Endpoint**: DELETE /cart/:itemId
* **설명**: 장바구니에서 특정 상품을 삭제합니다.
* **응답**:
  * 상태 코드: 200 OK

  ```json
  {
    "success": true,
    "data": null,
    "message": null
  }
  ```

### 4.3 장바구니 조회

* **Endpoint**: GET /cart
* **설명**: 사용자의 장바구니 내용을 조회합니다.
* **응답**:
  * 상태 코드: 200 OK

  ```json
  {
    "success": true,
    "data": {
      "cartItems": [
        {
          "id": number,
          "cartId": number,
          "productId": number,
          "quantity": number
        }
      ]
    },
    "message": null
  }
  ```
