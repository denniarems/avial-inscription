import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
} from "https://esm.sh/viem@2.4.1";
import { mnemonicToAccount } from "https://esm.sh/viem@2.4.1/accounts";
import { blastSepolia } from "https://esm.sh/viem@2.4.1/chains";
import { load } from "https://deno.land/std@0.211.0/dotenv/mod.ts";
const env = await load();
const key = env["KEY"];
export const wagmiAbi = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const account = mnemonicToAccount(
  key,
);

export const publicClient = createPublicClient({
  chain: blastSepolia,
  transport: http(),
});

const client = createWalletClient({
  account,
  chain: blastSepolia,
  transport: http(),
});

const run = async () => {
        const { request } = await publicClient.simulateContract({
            account,
            address: "0x942598A9dF483a076fAc0951a55eb5B3AF60B56B",
            abi: wagmiAbi,
            functionName: "mint",
            args: [parseEther("1000")],
        });
        await client.writeContract(request);
        console.log("done");
        setTimeout(run, 1000);
};


await run()
