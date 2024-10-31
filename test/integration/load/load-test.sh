#!/bin/bash

# DB 마이그레이션 초기화 및 적용
npx prisma migrate reset -f
npx prisma migrate deploy

# 시드 데이터 생성
npx prisma db seed

# k6 로드 테스트 실행
k6 run test/integration/load/load-test.js