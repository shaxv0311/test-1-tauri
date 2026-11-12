const NoData = ({ message = "No data available", className = "" }) => {
  return (
    <div className={`table-empty ${className}`}>{message}</div>
  );
};

export default NoData;
