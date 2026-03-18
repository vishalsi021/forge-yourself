import { deleteDB, openDB } from 'idb';

const DB_NAME = 'forge-offline';
const STORE_NAME = 'mutations';
const handlers = new Map();

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function enqueueMutation(item) {
  const db = await getDb();
  await db.add(STORE_NAME, { ...item, createdAt: Date.now() });
}

export async function readQueuedMutations() {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export async function clearMutation(id) {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export function registerQueueHandler(type, handler) {
  handlers.set(type, handler);
}

export async function flushMutationQueue() {
  const items = await readQueuedMutations();

  for (const item of items) {
    const handler = handlers.get(item.type);
    if (!handler) continue;

    await handler(item.payload);
    await clearMutation(item.id);
  }
}

export async function resetOfflineQueue() {
  await deleteDB(DB_NAME);
}

export async function registerBackgroundSync() {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  if ('sync' in registration) {
    await registration.sync.register('forge-sync');
  }
}
