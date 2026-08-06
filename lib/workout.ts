// PDF's progression is 4 blocks over 12 weeks (~3 weeks/block: form → volume
// → intensity → peak). Once the 12 weeks are exhausted the program holds at
// block 4 rather than running off the end of block_progression's 4 keys.
export function currentProgressionBlock(
  programStartDate: string,
  todayDate: string
): number {
  const start = new Date(`${programStartDate}T00:00:00Z`);
  const today = new Date(`${todayDate}T00:00:00Z`);
  const daysElapsed = Math.max(
    Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
    0
  );
  const block = Math.floor(daysElapsed / 7 / 3) + 1;
  return Math.min(Math.max(block, 1), 4);
}
