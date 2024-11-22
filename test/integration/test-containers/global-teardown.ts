import { StartedTestContainer } from 'testcontainers';

export default async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (globalThis as any).containers.forEach(
    (container: StartedTestContainer) => container.stop({ timeout: 10_000 }),
  );
};
