import { cleanLongBoii } from "../utils/format";

const isClient = typeof window !== "undefined";

export const getKey = (longBoi: string): string => {
  return `longBoii:${cleanLongBoii(longBoi).toLowerCase()}}`;
};

/**
 * Set a value in localStorage
 */
export const setItem = <T>(key: string, value: T): boolean => {
  if (!isClient) return false;

  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error("Error setting localStorage item:", error);
    return false;
  }
};

/**
 * Get a value from localStorage
 */
export const getItem = <T>(key: string): T | null => {
  if (!isClient) return null;

  try {
    const item = localStorage.getItem(key);
    if (item === null) return null;

    return JSON.parse(item) as T;
  } catch (error) {
    console.error("Error getting localStorage item:", error);
    return null;
  }
};
