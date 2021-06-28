import React from 'react';

const LoaderSpinner = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="loaderSpinner ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
    </div>
  );
};

export default LoaderSpinner;
