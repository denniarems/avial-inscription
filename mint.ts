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
  const remarkTx = api.tx.system.remarkWithEvent(JSON.stringify(payload));
  console.log("🚀 ~ transferWithTimeout ~ remarkTx:", remarkTx.toHuman(true));
  await remarkTx.signAndSend(alice, async ({ status, events, txHash }) => {
    if (status.isInvalid) {
      console.log("Transaction invalid");
    } else if (status.isReady) {
      console.log(`${count} Transaction is ready`);
    } else if (status.isBroadcast) {
      console.log(`${count} Transaction has been broadcasted`);
    } else if (status.isInBlock) {
      console.log(`${count} Transaction is in block`);
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
            console.log(`${dispatchError.type}.${dispatchError.asToken.type}`);
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
    }
  }).catch((error) => {
    console.log(":( transaction failed");
    console.error("ERROR:", error);
  });
  count++;
  setTimeout(transferWithTimeout, 30000); // 10 seconds
}

await transferWithTimeout();
