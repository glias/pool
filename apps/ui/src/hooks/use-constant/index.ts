import { useRef } from 'react';

export function useConstant<V>(thunk: () => V) {
  const ref = useRef<V>();

  if (!ref.current) {
    ref.current = thunk();
  }

  return ref.current;
}
