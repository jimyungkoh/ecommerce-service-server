# 주문-결제 시스템 부하 테스트 계획서

"고객이 상품을 주문하고 결제하는 과정에서, 이커머스 서비스 시스템은 얼마나 많은 주문을 안정적으로 처리할 수 있을까?"

이 질문에 답하기 위해 부하 테스트를 계획했습니다. 시스템은 주문-재고-결제 트랜잭션이 분리된 MSA 구조로, 각 서비스는 아웃박스 패턴을 통해 메시지를 주고받습니다.

```mermaid
flowchart TB
    subgraph MarketSystem["주문 서비스"]
        direction TB
        T1[Begin Transaction]
        T2[Create Order]
        T3[Order Event Publish]
        T4[Commit]
        T5[End Transaction]
        
        T1 --> T2 --> T3 --> T4 --> T5
    end

    subgraph ProductSystem["상품 서비스"]
        direction TB
        P1[Message Receive]
        P2[Begin Transaction]
        P3[Deduct Stock]
        P4[Order Event Publish]
        P5[End Transaction]
        
        P1 --> P2 --> P3 --> P4 --> P5
    end

    subgraph UserSystem["결제 서비스"]
        direction TB
        U1[Message Receive]
        U2[Begin Transaction]
        U3[Process Payment]
        U4[Order Event Publish]
        U5[End Transaction]
        
        U1 --> U2 --> U3 --> U4 --> U5
    end

    subgraph CompleteSystem["주문 완료"]
        direction TB
        C1[Message Receive]
        C2[Begin Transaction]
        C3[Update Status]
        C4[Commit]
        
        C1 --> C2 --> C3 --> C4
    end

    %% 시스템간 연결
    T3 ==> P1
    P4 ==> U1
    U4 ==> C1

    %% 스타일링
    classDef default fill:transparent,stroke:#fff,color:#fff
    classDef system fill:transparent,stroke:#fff,color:#fff,stroke-width:2px

    class MarketSystem,ProductSystem,UserSystem,CompleteSystem system
```

### 테스트가 필요한 이유

금요일 저녁 7시, 수많은 사용자가 동시에 인기 상품을 주문합니다. 이때 세 가지를 보장해야 합니다:

1. 재고는 정확하게 차감되어야 합니다
2. 결제는 한 번만 이루어져야 합니다
3. 주문 상태는 일관성을 유지해야 합니다

### 확인하고 싶은 것

재고 차감의 동시성 제어를 검증하고자 합니다. 10,000명의 사용자가 동시에 한정 수량 상품을 주문할 때, 우리 시스템은 이를 올바르게 처리할 수 있을까요?

장애 상황에서의 복원력도 확인해야 합니다. 결제 실패 시 재고는 정확히 복구되고, 주문은 실패 상태로 일관되게 마무리될까요?

아웃박스 패턴을 통한 메시지 전달은 신뢰성을 보장하나요? 결제 완료부터 주문 상태 업데이트까지, 전체 플로우가 결과적 일관성을 달성할 수 있을까요?

### 구체적인 테스트 방법: 동시 주문 시나리오
- 10,000명의 가상 사용자가 1개의 상품을 동시 주문
- 재고가 부족한 상품을 포함해 엣지 케이스 검증
- 잔액이 부족한 사용자를 포함해 실패 케이스 처리 확인

