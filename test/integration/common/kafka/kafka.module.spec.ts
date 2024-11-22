import { Admin, Consumer, Kafka, Partitioners, Producer } from 'kafkajs';

describe('Kafka Producer-Consumer 통합 테스트', () => {
  let producer: Producer;
  let consumer: Consumer;
  let admin: Admin;
  let kafka: Kafka;
  const TEST_TOPIC = 'test-topic';

  beforeAll(async () => {
    const brokerList = (process.env.KAFKA_BROKERS ?? '').split(';');

    kafka = new Kafka({
      clientId: 'test-service',
      brokers: brokerList,
      connectionTimeout: 3_000,
      requestTimeout: 3_000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30_000,
      },
    });

    admin = kafka.admin();
    await admin.connect();
    await cleanupAndCreateTopic();

    producer = kafka.producer({
      allowAutoTopicCreation: false,
      createPartitioner: Partitioners.LegacyPartitioner,
      retry: {
        retries: 5,
        maxRetryTime: 30_000,
      },
    });
    await producer.connect();

    consumer = kafka.consumer({
      groupId: 'test-service-group',
      maxWaitTimeInMs: 30_000,
      allowAutoTopicCreation: false,
      sessionTimeout: 30_000,
      heartbeatInterval: 3_000,
    });

    await consumer.connect();
    await consumer.subscribe({
      topic: TEST_TOPIC,
      fromBeginning: true,
    });
  }, 30_000);

  afterAll(async () => {
    await consumer?.disconnect();
    await producer?.disconnect();
    await admin?.disconnect();
  }, 10_000);

  async function cleanupAndCreateTopic() {
    const topics = await admin.listTopics();
    if (topics.includes(TEST_TOPIC)) {
      await admin.deleteTopics({
        topics: [TEST_TOPIC],
        timeout: 5_000,
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    await admin.createTopics({
      topics: [
        {
          topic: TEST_TOPIC,
          numPartitions: 1,
          replicationFactor: 1,
          configEntries: [
            { name: 'cleanup.policy', value: 'delete' },
            { name: 'min.insync.replicas', value: '1' },
          ],
        },
      ],
      timeout: 5_000,
    });
    // 토픽이 완전히 준비될 때까지 대기
    let isTopicReady = false;
    while (!isTopicReady) {
      const metadata = await admin.fetchTopicMetadata({ topics: [TEST_TOPIC] });
      if (metadata.topics[0]?.partitions?.length > 0) {
        isTopicReady = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  it('컨슈머가 프로듀서가 발행한 메시지를 정상적으로 수신하는지 확인', async () => {
    const TEST_MESSAGE = { message: 'test message' };
    const receivedMessages: { value: string }[] = [];
    let resolver: (value: unknown) => void;

    const messagePromise = new Promise((resolve) => {
      resolver = resolve;
    });

    await consumer.run({
      autoCommit: true,
      eachMessage: async ({ topic, partition, message }) => {
        console.log('Message received:', {
          topic,
          partition,
          value: message.value?.toString(),
          timestamp: message.timestamp,
        });

        receivedMessages.push({
          value: message.value?.toString() ?? '',
        });

        if (receivedMessages.length === 1) {
          resolver(true);
        }
      },
    });

    await producer.send({
      topic: TEST_TOPIC,
      messages: [
        {
          value: JSON.stringify(TEST_MESSAGE),
          timestamp: Date.now().toString(),
        },
      ],
    });

    await Promise.race([
      messagePromise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Timeout waiting for message')),
          5_000,
        ),
      ),
    ]);

    await consumer.stop();

    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0].value).toEqual(JSON.stringify(TEST_MESSAGE));
  }, 10_000);
});
