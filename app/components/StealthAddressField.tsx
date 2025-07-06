export const StealthAddressField = ({
  stealthAddress,
}: {
  stealthAddress: string;
}) => {
  if (!stealthAddress) return null;

  return (
    <div>
      <input
        type="text"
        placeholder="Stealth Address"
        className="address-input"
        value={stealthAddress}
        disabled
      />
    </div>
  );
};
