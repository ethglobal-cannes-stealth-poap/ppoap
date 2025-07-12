import toast from "react-hot-toast";

export const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const cleanLongBoii = (longBoii: string) => {
  if (!longBoii) return "";
  return longBoii.slice(-134);
};

export const copyToClipboard = async (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Address copied to clipboard!", {
    duration: 3000,
  });
};
