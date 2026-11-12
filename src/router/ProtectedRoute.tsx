import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "./routes";
import { useGetMeQuery } from "../api/featutres/authFeatures/authApi";
import { ReactNode } from "react";
import CircleLoader from "../components/ui/CircleLoader";
interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const token = localStorage.getItem("auth_token");

  const { isLoading, isError, isSuccess } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (isError) {
      localStorage.removeItem("auth_token");
    }
  }, [isError]);

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (isLoading) {
    return (
      <div className="protected-route-loader">
        <CircleLoader />
      </div>
    );
  }

  if (isError || !isSuccess) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}
