import {
  ApiPromise,
  Keyring,
  WsProvider,
} from "https://deno.land/x/polkadot@0.2.42/api/mod.ts";
import { API_EXTENSIONS, API_RPC, API_TYPES } from "./config.ts";
import { load } from "https://deno.land/std@0.211.0/dotenv/mod.ts";

const api = await ApiPromise.create({
  provider: new WsProvider("wss://goldberg.avail.tools/ws"),
  rpc: API_RPC,
  types: API_TYPES,
  signedExtensions: API_EXTENSIONS,
});

const env = await load();
const key = env["KEY"];

if (!key) {
  console.error("Environment variable 'KEY' is not set.");
  Deno.exit(1);
}
const alice = new Keyring({ type: "sr25519" }).addFromUri(
  key,
);
const payload = {
  p: "avc-20",
  op: "mint",
  tick: "BLOB",
  amt: "1000",
};
let count = 0;
async function transferWithTimeout() {
  const { data: { free: freeBalance } } = await api.query.system.account(
    alice.address,
  );
  console.log(`Available balance of ${alice.address}: ${freeBalance}`);

  const txs = [];
  for (let i = 0; i < 99; i++) {
    txs.push(api.tx.system.remarkWithEvent(JSON.stringify(payload)));
  }
  const remarkTx = api.tx.utility.batchAll(txs);
  const nonce = await api.rpc.system.accountNextIndex(alice.address);
  console.log("🚀 ~ Wallet ~ nounce:", nonce.toNumber());
  const unsub = await remarkTx.signAndSend(
    alice,
    { nonce },
    async ({ status, events, txHash }) => {
      if (status.isInvalid) {
        console.log("Transaction invalid");
      } else if (status.isReady) {
        console.log(`${count} Transaction is ready`);
      } else if (status.isBroadcast) {
        console.log(`${count} Transaction has been broadcasted`);
      } else if (status.isInBlock) {
        console.log(`${count} Transaction is in block`);
        console.log(
          `Extrinsic hash: ${txHash} is in block ${status.asInBlock.toHex()}`,
        );
        for (const { event: { data, method, section }, phase } of events) {
          if (method === "ExtrinsicSuccess") {
            console.log(`${count} Transaction Success`);
            console.log(
              `${count} Transaction has been included in blockHash ${txHash}`,
            );
            console.log(
              `https://goldberg.avail.tools/#/explorer/query/${status.asInBlock.toHex()}`,
            );
          } else if (method === "ExtrinsicFailed") {
            console.log("Transaction failed");
            const dispatchError = data?.dispatchError;

            if (dispatchError?.isModule) {
              const errorModule = data?.dispatchError?.asModule;
              const { method, section, docs } = api.registry.findMetaError(
                errorModule,
              );
            } else if (dispatchError?.isToken) {
              console.log(
                `${dispatchError.type}.${dispatchError.asToken.type}`,
              );
            }
          }
        }
      } else if (status.isFinalized) {
        console.log(
          `${count} Transaction has been included in blockHash ${status.asFinalized.toHex()}`,
        );
        console.log(
          `https://goldberg.avail.tools/#/explorer/query/${status.asFinalized.toHex()}`,
        );
        console.log(
          `Finalized block hash ${status.asFinalized} and tx hash ${txHash}`,
        );
        unsub();
      }
    },
  ).catch((error) => {
    console.log(":( transaction failed");
    console.error("ERROR:", error);
    if (error.message.includes("Inability to pay some fees")) {
      console.log("Insufficient balance to pay the fees for this transaction.");
      Deno.exit(1);
    }
  });
  count++;
  setTimeout(transferWithTimeout, 6000); // 20 seconds
}

await transferWithTimeout();
