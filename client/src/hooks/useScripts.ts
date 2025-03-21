import { useQuery } from '@tanstack/react-query';
import { Script } from '@shared/schema';

export function useScripts() {
  const { data, isLoading, error } = useQuery<Script[]>({ 
    queryKey: ['/api/scripts'],
  });

  return {
    scripts: data || [],
    isLoading,
    error
  };
}
