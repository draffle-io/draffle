import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";

const DT_MINT = new PublicKey("zRpVjG5wMWrNhpTtSiGMz9iBaMTQDdaVGCFLmYqCs4U");
const AIRDROPPER_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.REACT_APP_AIRDROPPER_KEYPAIR as string))
);

export const airdrop = async (connection: Connection, user: PublicKey) => {
  const aidropperATA = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    DT_MINT,
    AIRDROPPER_KEYPAIR.publicKey
  );

  const userATA = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    DT_MINT,
    user
  );

  let instructions: TransactionInstruction[] = [];
  const info = await connection.getAccountInfo(userATA);
  if (info === null) {
    instructions.push(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        DT_MINT,
        userATA,
        user,
        AIRDROPPER_KEYPAIR.publicKey
      ),
    );
  }
  instructions.push(
    Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      aidropperATA,
      userATA,
      AIRDROPPER_KEYPAIR.publicKey,
      [],
      3_000_000,
    )
  )
  instructions.push(
    SystemProgram.transfer({
      fromPubkey: AIRDROPPER_KEYPAIR.publicKey,
      toPubkey: user,
      lamports: 500_000_000
    })
  )

  const tx = new Transaction({feePayer: AIRDROPPER_KEYPAIR.publicKey});
  tx.add(...instructions);
  await connection.sendTransaction(tx, [AIRDROPPER_KEYPAIR]);
};
