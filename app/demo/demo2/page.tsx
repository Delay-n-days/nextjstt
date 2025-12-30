import RedisViewer from '@/components/redis-viewer';
import { getKeys } from "@/app/actions/redis";

export default async function Home() {
  const result = await getKeys('*');
  const initialKeys = result.success ? result.keys || [] : [];

  return <RedisViewer initialKeys={initialKeys} />;
}