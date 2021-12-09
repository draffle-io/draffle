# Specific scenario to spin up a test raffle on drafflenet for outsiders
# Disable reset when ready
set -e

SCRIPT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
ROOT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )/../"

[ -f "${SCRIPT_PATH}/../app/.env" ] && source "${SCRIPT_PATH}/../app/.env"
[ -f "${SCRIPT_PATH}/../app/.env.local" ] && source "${SCRIPT_PATH}/../app/.env.local"

${SCRIPT_PATH}/parse-and-generate-idl-types.sh

set -m
DRAFFLE_PROGRAM_ID="$(solana address -k ${SCRIPT_PATH}/sample_accounts/draffle-keypair.json)"
COMMUNITY_STAKING_PROGRAM_ID="$(solana address -k ${SCRIPT_PATH}/sample_accounts/community_staking-keypair.json)"

solana-test-validator \
--bpf-program ${DRAFFLE_PROGRAM_ID} ${SCRIPT_PATH}/../target/deploy/draffle.so \
--bpf-program ${COMMUNITY_STAKING_PROGRAM_ID} ${SCRIPT_PATH}/../target/deploy/community_staking.so \
--bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s scripts/metaplex_token_metadata.so \
--clone H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG \
--clone GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU \
--clone 3NBReDRTLKMQEKiLD5tGcx4kXbTf88b7f2xLS9UuGjym \
--url mainnet-beta \
--quiet --reset &

echo "Setting cluster to localnet..."
solana config set --url http://127.0.0.1:8899
echo "Done"

# Wait for test validator to be ready
sleep 5

echo "Getting accounts addresses..."
NFT1_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/prize-nft1-keypair.json)"
echo "${NFT1_ADDRESS}"
NFT2_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/prize-nft2-keypair.json)"

MINT1_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/dev-mint-keypair.json)"
echo "${MINT1_ADDRESS}"

MINT1_FAUCET_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/user2-keypair.json)"
echo "${MINT1_FAUCET_ADDRESS}"

echo "Creating sample mints, accounts, and funding them..."
spl-token create-token ${SCRIPT_PATH}/sample_accounts/prize-nft1-keypair.json --decimals 0
spl-token create-account ${NFT1_ADDRESS}
spl-token mint ${NFT1_ADDRESS} 1

spl-token create-token ${SCRIPT_PATH}/sample_accounts/prize-nft2-keypair.json --decimals 0
spl-token create-account ${NFT2_ADDRESS}
spl-token mint ${NFT2_ADDRESS} 1

spl-token create-token ${SCRIPT_PATH}/sample_accounts/dev-mint-keypair.json --decimals 6
spl-token create-account ${MINT1_ADDRESS}
spl-token mint ${MINT1_ADDRESS} 3000000

solana transfer --allow-unfunded-recipient ${MINT1_FAUCET_ADDRESS} 100
spl-token transfer --allow-unfunded-recipient --fund-recipient  ${MINT1_ADDRESS} 100 ${MINT1_FAUCET_ADDRESS}

echo "Creating sample raffles..."
cd ${ROOT_PATH}
cargo build
${SCRIPT_PATH}/../target/debug/draffle create-raffle ${MINT1_ADDRESS} 500000 "$(date --utc -d "+12 hour" '+%Y-%m-%d %H:%M')" "${SCRIPT_PATH}/sample_accounts/raffle/entrants1-keypair.json" # AopPMW9k4Q5K8bw9Vf8KEqk5wJNrkvkBWDCKzq1eDUBr
${SCRIPT_PATH}/../target/debug/draffle add-prize AopPMW9k4Q5K8bw9Vf8KEqk5wJNrkvkBWDCKzq1eDUBr ${NFT1_ADDRESS} 1 0
${SCRIPT_PATH}/../target/debug/draffle add-prize AopPMW9k4Q5K8bw9Vf8KEqk5wJNrkvkBWDCKzq1eDUBr ${NFT2_ADDRESS} 1 1

sleep 20 # Otherwise next command explodes

echo "Creating sample NFT metadata with URLs REACT_APP_URL=${REACT_APP_URL} and REACT_APP_RPC_ENDPOINT=${REACT_APP_RPC_ENDPOINT}"
${SCRIPT_PATH}/metaplex-token-metadata-test-client create_metadata_accounts --name "tRuffle" --symbol "" --uri "${REACT_APP_URL}/nfts/first-prize.json" --url "${REACT_APP_RPC_ENDPOINT}" --mint "${SCRIPT_PATH}/sample_accounts/prize-nft1-keypair.json" --keypair ~/.config/solana/id.json
${SCRIPT_PATH}/metaplex-token-metadata-test-client create_metadata_accounts --name "Sloth #1729" --symbol "" --uri "${REACT_APP_URL}/nfts/second-prize.json" --url "${REACT_APP_RPC_ENDPOINT}" --mint "${SCRIPT_PATH}/sample_accounts/prize-nft2-keypair.json" --keypair ~/.config/solana/id.json

fg 1