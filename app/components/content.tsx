export const mintingContent = (
  poap: any,
  isLoadingPoap: boolean,
  poapId: string
) => {
  if (isLoadingPoap) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading POAP...</p>
      </div>
    );
  }

  if (!isLoadingPoap && !poap) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <h2>POAP Not Found</h2>
        {poapId && <p className="error-details">Claim Name: {poapId}</p>}
        <p className="how-to">
          Please provide a claim name in the URL: /claim/your-claim-name
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="background-elements">
        <div className="star star-1">✦</div>
        <div className="star star-2">✦</div>
        <div className="star star-3">✦</div>
        <div className="star star-4">✦</div>
        <div className="star star-5">✦</div>
        <div className="star star-6">✦</div>
        <div className="star star-7">✦</div>
        <div className="star star-8">✦</div>
        <div className="star star-9">✦</div>
        <div className="star star-10">✦</div>
        <div className="star star-11">✦</div>
        <div className="star star-12">✦</div>
        <div className="cloud cloud-1">☁</div>
        <div className="cloud cloud-2">☁</div>
        <div className="cloud cloud-3">☁</div>
        <div className="cloud cloud-4">☁</div>
        <div className="cloud cloud-5">☁</div>
        <div className="cloud cloud-6">☁</div>
        <div className="cloud cloud-7">☁</div>
        <div className="cloud cloud-8">☁</div>
      </div>

      <div className="poap-container">
        <div className="poap-content">
          <div className="avatar-container">
            <div className="avatar">
              <img
                src={
                  poap?.image_url ||
                  poap?.image ||
                  "https://via.placeholder.com/150x150?text=POAP"
                }
                alt={poap?.name || "POAP"}
                className="avatar-image"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
