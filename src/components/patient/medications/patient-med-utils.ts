export function doseProgressPercent(meds: { taken: boolean }[]) {
  if (!meds.length) return 0;
  return Math.round((meds.filter((m) => m.taken).length / meds.length) * 100);
}

export function timeBadgeColors(time: string) {
  const hour = Number.parseInt(time, 10);
  const isMorning = !Number.isNaN(hour) ? hour < 12 : time.toLowerCase().includes("am");
  return isMorning
    ? { bg: "#FFF4DC", text: "#B8860B" }
    : { bg: "#E8F5E9", text: "#388E3C" };
}
