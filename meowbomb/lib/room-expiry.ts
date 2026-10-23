export const ROOM_IDLE_MS = 60 * 60 * 1000;
export const ROOM_EXPIRED_MESSAGE = 'ไม่พบห้อง ห้องอาจถูกปิดหรือหมดอายุแล้ว กรุณาสร้างห้องใหม่';
export function roomCutoff(now = Date.now()) { return now - ROOM_IDLE_MS; }
export function roomExpired(updated: number, now = Date.now()) { return updated <= roomCutoff(now); }
