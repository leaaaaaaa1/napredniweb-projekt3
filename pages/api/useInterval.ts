import { useEffect, useRef } from 'react';

//na kraju ovo nije ni koristeno kako je zamisljeno, htjela sam ici u ovom smjeru buduci da sam nesto slicno
//radila za zavrsni rad ali nije bilo potrebno
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<(() => void) | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
