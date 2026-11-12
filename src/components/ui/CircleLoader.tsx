interface CircleLoaderProps {
  loadingText?: string;
}

const CircleLoader = ({ loadingText }: CircleLoaderProps) => {
  return (
    <div className="circle-loader circle-loader-flex">
      <div className="circle-loader-spinner"></div>
      {loadingText && <p className="circle-loader-text">{loadingText}</p>}
    </div>
  );
};

export default CircleLoader;
