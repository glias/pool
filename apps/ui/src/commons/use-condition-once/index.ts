import { useEffect, useState } from 'react';

/**
 * when the condition becomes true, the cb would be called, and only once
 * @param cb
 * @param condition
 */
export function useConditionalOnce(cb: () => void, condition: boolean) {
  const [called, setCalled] = useState(false);

  useEffect(() => {
    if (!condition || called) return;
    setCalled(true);
    cb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition]);
}
