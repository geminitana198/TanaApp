// Lặp lại ngắt quãng (biến thể SM-2). Mức đánh giá: 0 Quên, 1 Khó, 2 Được, 3 Dễ
const SRS = (() => {
  const MIN = 60 * 1000;
  const DAY = 24 * 60 * MIN;
  const MASTERED_DAYS = 21;

  function startOfDay(t) {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function schedule(prev, rating, now = Date.now()) {
    const p = prev ? { ...prev } : { ease: 2.5, interval: 0, reps: 0, lapses: 0 };

    if (rating === 0) {
      p.reps = 0;
      p.lapses += 1;
      p.interval = 0;
      p.ease = Math.max(1.3, p.ease - 0.2);
      p.due = now + 10 * MIN;
    } else {
      if (p.reps === 0) p.interval = [0, 1, 1, 3][rating];
      else if (p.reps === 1) p.interval = [0, 2, 4, 6][rating];
      else p.interval = Math.round(p.interval * [0, 1.2, p.ease, p.ease * 1.3][rating]);
      p.interval = Math.max(1, p.interval);
      p.ease = Math.max(1.3, p.ease + [0, -0.15, 0, 0.15][rating]);
      p.reps += 1;
      p.due = startOfDay(now) + p.interval * DAY;
    }
    p.last = now;
    return p;
  }

  function label(prev, rating) {
    const p = schedule(prev, rating);
    if (rating === 0) return '10 phút';
    const days = p.interval;
    if (days < 30) return `${days} ngày`;
    if (days < 365) return `${Math.round(days / 30)} tháng`;
    return `${(days / 365).toFixed(1)} năm`;
  }

  const isDue = (p, now = Date.now()) => !!p && p.due <= now;
  const isMastered = (p) => !!p && p.interval >= MASTERED_DAYS;

  return { schedule, label, isDue, isMastered };
})();
