#!/bin/bash

# DB 마이그레이션 초기화 및 적용
npx prisma migrate reset -f
npx prisma migrate deploy

# 시드 데이터 생성
npx prisma db seed

# k6 로드 테스트 실행
xk6 build --with github.com/grafana/xk6-output-influxdb

K6_INFLUXDB_ORGANIZATION=hhplus \
K6_INFLUXDB_BUCKET=k6-metrics \
K6_INFLUXDB_TOKEN=admintoken123 \
K6_INFLUXDB_PUSH_INTERVAL=5s \
K6_INFLUXDB_CONCURRENT_WRITES=10 \
./k6 run \
  -o xk6-influxdb=http://localhost:8086 \
  test/integration/load/load-test.js