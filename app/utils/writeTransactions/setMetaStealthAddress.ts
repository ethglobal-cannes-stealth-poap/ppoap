import { REGISTRY_ADDRESS } from "../../constants/contracts";
import REGISTRY_ABI from "../../constants/abi/registryAbi.json";
import { useWriteContract } from "wagmi";
import toast from "react-hot-toast";

export const setMetaStealthAddress = async ({
  stealthMetaAddress,
}: {
  stealthMetaAddress: string;
}) => {
    const { writeContract } = useWriteContract()

    return writeContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: "registerKeys",
        args: [BigInt(1), stealthMetaAddress],
        onSuccess: () => {
            toast.success("Successfully registered meta address.");
            return true;
        },
        onError: (error: any) => {
            toast.error("Something went wrong");
        },
    })
};