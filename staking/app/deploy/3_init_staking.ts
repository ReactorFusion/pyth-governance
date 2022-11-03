import { Wallet, AnchorProvider, Program } from "@project-serum/anchor";
import { Connection } from "@solana/web3.js";
import { getTargetAccount } from "../../tests/utils/utils";
import {
  AUTHORITY_KEYPAIR,
  PYTH_TOKEN,
  RPC_NODE,
  EPOCH_DURATION,
} from "./mainnet_beta";
import { BN } from "bn.js";
import { STAKING_ADDRESS, REALM_ID } from "../constants";

// Actual transaction hash :
// mainnet-beta : KrWZD8gbH6Afg6suwHrmUi1xDo25rLDqqMAoAdunXmtUmuVk5HZgQvDqxFHC2uidL6TfXSmwKdQnkbnbZc8BZam

async function main() {
  const client = new Connection(RPC_NODE);
  const provider = new AnchorProvider(
    client,
    new Wallet(AUTHORITY_KEYPAIR),
    {}
  );
  const idl = (await Program.fetchIdl(STAKING_ADDRESS, provider))!;
  const program = new Program(idl, STAKING_ADDRESS, provider);

  const globalConfig = {
    governanceAuthority: AUTHORITY_KEYPAIR.publicKey,
    pythGovernanceRealm: REALM_ID,
    pythTokenMint: PYTH_TOKEN,
    unlockingDuration: 1,
    epochDuration: new BN(EPOCH_DURATION),
    freeze: false,
  };
  await program.methods.initConfig(globalConfig).rpc();

  const votingTarget = { voting: {} };
  const targetAccount = await getTargetAccount(votingTarget, STAKING_ADDRESS);
  await program.methods
    .createTarget(votingTarget)
    .accounts({
      targetAccount,
      governanceSigner: AUTHORITY_KEYPAIR.publicKey,
    })
    .rpc();

  await program.methods.updateMaxVoterWeight().rpc();
}

main();