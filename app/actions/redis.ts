'use server'

import redis from '@/lib/redis';

export async function getKeys(pattern: string = '*') {
  try {
    const keys = await redis.keys(pattern);
    return { success: true, keys };
  } catch (error) {
    return { success: false, error: 'Failed to fetch keys' };
  }
}

export async function getKeyType(key: string) {
  try {
    const type = await redis.type(key);
    return { success: true, type };
  } catch (error) {
    return { success: false, error: 'Failed to get key type' };
  }
}

export async function getStringValue(key: string) {
  try {
    const value = await redis.get(key);
    const ttl = await redis.ttl(key);
    return { success: true, value, ttl };
  } catch (error) {
    return { success: false, error: 'Failed to get value' };
  }
}

export async function getListValue(key: string) {
  try {
    const value = await redis.lrange(key, 0, -1);
    const ttl = await redis.ttl(key);
    return { success: true, value, ttl };
  } catch (error) {
    return { success: false, error: 'Failed to get list' };
  }
}

export async function deleteKey(key: string) {
  try {
    await redis.del(key);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete key' };
  }
}

export async function setStringValue(key: string, value: string, ttl?: number) {
  try {
    await redis.set(key, value);
    if (ttl && ttl > 0) {
      await redis.expire(key, ttl);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to set value' };
  }
}

export async function addListItem(key: string, value: string) {
  try {
    await redis.rpush(key, value);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to add item' };
  }
}