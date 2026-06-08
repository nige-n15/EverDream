import { useEffect, useState } from 'react';
import { resolveVideoURL } from '../../lib/storage/videoStore';

interface IdbVideoProps {
  /** A normal URL or an "idb:<id>" reference to a video stored in IndexedDB */
  src?: string | null;
  poster?: string;
  className?: string;
}

/**
 * <video> that can play either a normal URL or an "idb:<id>" reference,
 * resolving the latter from IndexedDB to an object URL (and revoking it on cleanup).
 */
export function IdbVideo({ src, poster, className }: IdbVideoProps) {
  const [resolved, setResolved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let revoke = () => {};
    setLoading(true);
    resolveVideoURL(src).then((r) => {
      if (!active) {
        r.revoke();
        return;
      }
      revoke = r.revoke;
      setResolved(r.url);
      setLoading(false);
    });
    return () => {
      active = false;
      revoke();
    };
  }, [src]);

  if (loading) {
    return (
      <div className={className} style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        Loading video…
      </div>
    );
  }
  if (!resolved) {
    return (
      <div className={className} style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        Video unavailable
      </div>
    );
  }
  return <video src={resolved} controls className={className} poster={poster} />;
}

export default IdbVideo;
