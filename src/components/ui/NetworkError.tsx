import { WifiOff } from "lucide-react";

interface NetworkErrorProps {
  isOnline: boolean;
}

export default function NetworkError() {
  return (
    <div className="network-error-page">
      <div className="network-error-content">
        {/* Icon */}
        <div className="network-error-icon-box">
          <WifiOff size={36} className="text-red" strokeWidth={1.8} />
        </div>

        {/* Title */}
        <h1 className="network-error-title">No Internet Connection</h1>

        {/* Description */}
        <p className="network-error-desc">
          It looks like you're offline. Please check your network connection and
          try again.
        </p>

        {/* Additional info */}
        <p className="network-error-info">
          Connection is checked automatically every 10 seconds.
        </p>
      </div>
    </div>
  );
}
