import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useLoginMutation } from "../../api/featutres/authFeatures/authApi";
import { ROUTES } from "../../router/routes";

import {
  getBiometricCredentials,
  hasBiometricCredentials,
  isAndroidApp,
  removeBiometricCredentials,
} from "../../services/biometric/biometric";

interface Props {
  children: React.ReactNode;
}

export default function BiometricStartup({ children }: Props) {
  const navigate = useNavigate();

  const [login] = useLoginMutation();

  const [initialized, setInitialized] = useState(false);

  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;

    started.current = true;

    const initialize = async () => {
      // Desktop: continue with the existing login flow
      if (!isAndroidApp()) {
        setInitialized(true);
        return;
      }

      // First installation or user has not enabled secure login
      if (!hasBiometricCredentials()) {
        localStorage.removeItem("auth_token");

        navigate(ROUTES.LOGIN, { replace: true });

        setInitialized(true);
        return;
      }

      // Don't allow an old session to bypass authentication
      localStorage.removeItem("auth_token");

      try {
        // 1. Android biometric/PIN prompt appears here
        // 2. Credentials are decrypted only after success
        const credentials = await getBiometricCredentials();

        // 3. Send credentials to your existing backend
        const response = await login(credentials).unwrap();

        // 4. Backend must return a valid token
        const token = response?.data?.token || response?.token;

        if (!token) {
          throw new Error("Backend authentication token missing");
        }

        // 5. Save the new token
        localStorage.setItem("auth_token", token);

        // 6. Open dashboard
        navigate(ROUTES.DASHBOARD, { replace: true });
      } catch (error: any) {
        console.error("Automatic login failed:", error);

        localStorage.removeItem("auth_token");

        // Remove saved credentials only when backend rejects them
        if (error?.status === 401) {
          removeBiometricCredentials();
        }

        // Cancellation, authentication failure, network failure,
        // or backend failure -> normal login page
        navigate(ROUTES.LOGIN, { replace: true });
      } finally {
        setInitialized(true);
      }
    };

    void initialize();
  }, [login, navigate]);

  //   if (!initialized) {
  //     return (
  //       <div className="flex min-h-screen items-center justify-center">
  //         <p>Authenticating...</p>
  //       </div>
  //     );
  //   }

  return <>{children}</>;
}
