import { Navigate } from 'react-router-dom';
import { PageLoader } from './PageLoader';

interface ErrorGuardProps {
  isLoading: boolean;
  isError: boolean;
  data: boolean;
  redirectTo: string;
}

export function ErrorGuard({
  isLoading,
  isError,
  data,
  redirectTo,
}: ErrorGuardProps) {
  if (isLoading) return <PageLoader />;

  if (isError || !data) return <Navigate to={redirectTo} replace />;

  return null;
}
