import { LockKeyhole, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import loginBg from "../assets/login_bg.png";
import software_logo from "../assets/software_logo.png";

import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

import { useForm } from "react-hook-form";
import {
  defaultLogin,
  LoginFrom,
  loginSchema,
} from "../api/featutres/authFeatures/authSchema";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLoginMutation } from "../api/featutres/authFeatures/authApi";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../router/routes";
import { setToastMessage } from "../helper/helper";

import {
  isAndroidApp,
  hasBiometricCredentials,
  saveBiometricCredentials,
} from "../services/biometric/biometric";

import { getDeviceLocation } from "../services/location/location";

type LocationDialogType = "permission" | "gps";

const LOCATION_ASKED_KEY = "location_permission_asked";

export const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationDialogType, setLocationDialogType] =
    useState<LocationDialogType>("permission");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);

  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFrom>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: defaultLogin,
  });

  const goToDashboard = () => {
    setShowLocationDialog(false);
    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  // Runs ONLY after a successful login (Android)
  const checkDeviceLocation = async () => {
    setIsGettingLocation(true);

    try {
      const location = await getDeviceLocation();

      console.log("Latitude:", location.latitude);
      console.log("Longitude:", location.longitude);
      console.log("Accuracy:", location.accuracy);

      localStorage.setItem(LOCATION_ASKED_KEY, "true");

      setToastMessage("success", "Login successful");
      goToDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error("Location error:", message);

      if (message === "LOCATION_PERMISSION_DENIED") {
        const alreadyAsked =
          localStorage.getItem(LOCATION_ASKED_KEY) === "true";

        localStorage.setItem(LOCATION_ASKED_KEY, "true");

        if (alreadyAsked) {
          // Denied before: show the "go to settings" dialog
          setLocationDialogType("permission");
          setShowLocationDialog(true);
        } else {
          // First denial: continue to dashboard
          setToastMessage("error", "Location permission was not granted.");
          goToDashboard();
        }
        return;
      }

      if (message === "LOCATION_SERVICES_DISABLED") {
        setLocationDialogType("gps");
        setShowLocationDialog(true);
        return;
      }

      setToastMessage("error", "Unable to get device location.");
      goToDashboard();
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Open Android app settings or GPS settings (native plugin)
  const handleGoToSettings = async () => {
    if (!isAndroidApp()) return;

    setIsOpeningSettings(true);

    try {
      if (locationDialogType === "permission") {
        await invoke("plugin:location-settings|open_app_settings");
      } else {
        await invoke("plugin:location-settings|open_location_settings");
      }
    } catch (error) {
      console.error("Unable to open Android Settings:", error);
      setToastMessage(
        "error",
        "Unable to open Android Settings. Please enable it manually.",
      );
    } finally {
      setIsOpeningSettings(false);
    }
  };

  const onSubmit = async (data: LoginFrom) => {
    try {
      // 1. Backend login
      const response = await login(data).unwrap();

      // 2. Extract token
      const token = response?.data?.token || response?.token;

      if (!token) {
        throw new Error("Login token was not returned");
      }

      // 3. Save token
      localStorage.setItem("auth_token", token);

      // 4. Biometric/PIN setup
      if (isAndroidApp() && !hasBiometricCredentials()) {
        const enable = window.confirm(
          "Would you like to enable automatic biometric/PIN login on this device?",
        );

        if (enable) {
          try {
            await saveBiometricCredentials({
              email: data.email,
              password: data.password,
            });
            setToastMessage("success", "Secure login enabled successfully");
          } catch (error) {
            console.error("Secure login setup failed:", error);
            setToastMessage(
              "error",
              "Could not enable secure login. You can continue normally.",
            );
          }
        }
      }

      // 5. Ask for location permission only after login success
      if (isAndroidApp()) {
        await checkDeviceLocation();
      } else {
        setToastMessage("success", "Login successful");
        goToDashboard();
      }
    } catch (err: any) {
      console.error("Login failed:", err);

      if (err?.status === 401) {
        setToastMessage("error", "Invalid email or password");
        return;
      }

      setToastMessage(
        "error",
        err?.data?.message || err?.message || "Something went wrong",
      );
    }
  };

  return (
    <div className="login-page">
      {/* Left Section */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-logo">
            <img src={software_logo} alt="Billnex" className="login-logo-img" />
          </div>

          <h1 className="login-title">
            Smart Billing.
            <br />
            Better Business.
          </h1>

          <p className="login-subtitle">
            Create invoices, manage customers, track
            <br />
            payments and grow your business with ease.
          </p>
        </div>

        <div className="login-left-bg">
          <img src={loginBg} alt="" className="login-left-bg-img" />
        </div>
      </div>

      {/* Right Section */}
      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-icon-block">
            <div className="login-icon-circle">
              <LockKeyhole size={25} strokeWidth={1.8} />
            </div>

            <h2 className="login-heading">Welcome Back!</h2>

            <p className="login-heading-desc">
              Login to access your billing dashboard
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <Input
              {...register("email")}
              label="Enter Your Email ID"
              placeholder="Email Address"
              className="bg-white"
              labelClassName="text-base"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
            />

            <div className="login-input-wrap">
              <Input
                {...register("password")}
                label="Enter Your Password"
                placeholder="Password"
                className="bg-white login-input-password"
                labelClassName="text-base"
                error={errors.password?.message}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="login-password-toggle"
              >
                {showPassword ? (
                  <EyeOff size={15} className="login-password-icon" />
                ) : (
                  <Eye size={15} className="login-password-icon" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="login-submit"
              loading={isLoading || isGettingLocation}
              disabled={isLoading || isGettingLocation}
            >
              <span>
                {isLoading
                  ? "Logging in..."
                  : isGettingLocation
                    ? "Getting location..."
                    : "Login"}
              </span>
            </Button>
          </form>
        </div>

        {/* Mobile Illustration */}
        <div className="login-mobile-bg">
          <img src={loginBg} alt="" className="login-mobile-bg-img" />
        </div>
      </div>

      {/* Location Dialog */}
      {showLocationDialog && (
        <div className="location-modal-overlay">
          <div
            className="location-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-dialog-title"
          >
            <div className="location-modal-icon">📍</div>

            <h3 id="location-dialog-title">
              {locationDialogType === "permission"
                ? "Location Permission Required"
                : "Location Services Disabled"}
            </h3>

            <p>
              {locationDialogType === "permission"
                ? "Location access is not allowed for Billnex. Please enable location permission in your app settings."
                : "Your phone's GPS is turned off. Please enable Location Services to get your current location."}
            </p>

            <Button
              type="button"
              className="location-enable-button"
              onClick={handleGoToSettings}
              disabled={isOpeningSettings}
            >
              {isOpeningSettings
                ? "Opening Settings..."
                : locationDialogType === "permission"
                  ? "Go to App Settings"
                  : "Enable Location"}
            </Button>

            <Button
              type="button"
              className="location-retry-button"
              onClick={checkDeviceLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? "Checking..." : "I Have Enabled It"}
            </Button>

            <button
              type="button"
              className="location-cancel-button"
              onClick={goToDashboard}
            >
              Continue without location
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
