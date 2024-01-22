import {
  createPublicClient,
  createWalletClient,
  http,
} from "https://esm.sh/viem@2.4.1";
import { mnemonicToAccount } from "https://esm.sh/viem@2.4.1/accounts";
import { blastSepolia } from "https://esm.sh/viem@2.4.1/chains";
import { load } from "https://deno.land/std@0.211.0/dotenv/mod.ts";
const env = await load();
const key = env["KEY"];
export const wagmiAbi = [
  {
    inputs: [],
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

setTimeout(async () => {
  const { request } = await publicClient.simulateContract({
    account,
    address: "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
    abi: wagmiAbi,
    functionName: "mint",
    args: ['1000000000000000000000n']
  });
  console.log(request.nonce, request.gasPrice);
  await client.writeContract(request);
}, 5000);
