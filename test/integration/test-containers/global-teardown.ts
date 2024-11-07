export default async () => {
  const containers = global.containers;

  for (const container of Object.values(containers)) {
    await container.stop({ timeout: 10_000 });
  }

  return;
};
