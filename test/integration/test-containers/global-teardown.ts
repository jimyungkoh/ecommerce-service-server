export default async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (globalThis as any).containers.database.stop({ timeout: 10_000 });
};
