set -e

SCRIPT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
ROOT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )/../"

[ -f "${SCRIPT_PATH}/../app/.env" ] && source "${SCRIPT_PATH}/../app/.env"
[ -f "${SCRIPT_PATH}/../app/.env.local" ] && source "${SCRIPT_PATH}/../app/.env.local"

${SCRIPT_PATH}/setup_idls.sh

set -m
DRAFFLE_PROGRAM_ID="$(solana address -k ${SCRIPT_PATH}/sample_accounts/draffle-keypair.json)"
COMMUNITY_STAKING_PROGRAM_ID="$(solana address -k ${SCRIPT_PATH}/sample_accounts/community_staking-keypair.json)"
DISPENSER_PROGRAM_ID="$(solana address -k ${SCRIPT_PATH}/sample_accounts/dispenser-keypair.json)"

solana-test-validator \
--bpf-program ${DRAFFLE_PROGRAM_ID} ${SCRIPT_PATH}/../target/deploy/draffle.so \
--bpf-program ${COMMUNITY_STAKING_PROGRAM_ID} ${SCRIPT_PATH}/../target/deploy/community_staking.so \
--bpf-program ${DISPENSER_PROGRAM_ID} ${SCRIPT_PATH}/../target/deploy/dispenser.so \
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
echo "${NFT2_ADDRESS}"
NFT3_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/prize-nft3-keypair.json)"
echo "${NFT3_ADDRESS}"
NFT4_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/prize-nft4-keypair.json)"
echo "${NFT4_ADDRESS}"
NFT5_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/prize-nft5-keypair.json)"
echo "${NFT5_ADDRESS}"

MINT1_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/dev-mint-keypair.json)"
echo "${MINT1_ADDRESS}"
MINT2_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/prize-mint1-keypair.json)"
echo "${MINT2_ADDRESS}"
MINT3_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/prize-mint2-keypair.json)"
echo "${MINT3_ADDRESS}"
TEST_USER_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/user1-keypair.json)"
echo "${TEST_USER_ADDRESS}"
MINT1_FAUCET_ADDRESS="$(solana address -k ${SCRIPT_PATH}/sample_accounts/user2-keypair.json)"
echo "${MINT1_FAUCET_ADDRESS}"
WSOL=So11111111111111111111111111111111111111112
echo "Done"

echo "Creating sample mints, accounts, and funding them..."
spl-token create-token ${SCRIPT_PATH}/sample_accounts/prize-nft1-keypair.json --decimals 0
spl-token create-account ${NFT1_ADDRESS}
spl-token mint ${NFT1_ADDRESS} 1

spl-token create-token ${SCRIPT_PATH}/sample_accounts/prize-nft2-keypair.json --decimals 0
spl-token create-account ${NFT2_ADDRESS}
spl-token mint ${NFT2_ADDRESS} 1

spl-token create-token ${SCRIPT_PATH}/sample_accounts/prize-nft3-keypair.json --decimals 0
spl-token create-account ${NFT3_ADDRESS}
spl-token mint ${NFT3_ADDRESS} 1

spl-token create-token ${SCRIPT_PATH}/sample_accounts/prize-nft4-keypair.json --decimals 0
spl-token create-account ${NFT4_ADDRESS}
spl-token mint ${NFT4_ADDRESS} 1

spl-token create-token ${SCRIPT_PATH}/sample_accounts/prize-nft5-keypair.json --decimals 0
spl-token create-account ${NFT5_ADDRESS}
spl-token mint ${NFT5_ADDRESS} 1

spl-token create-token ${SCRIPT_PATH}/sample_accounts/dev-mint-keypair.json --decimals 6
spl-token create-account ${MINT1_ADDRESS}
spl-token mint ${MINT1_ADDRESS} 3000000

spl-token create-token ${SCRIPT_PATH}/sample_accounts/prize-mint1-keypair.json --decimals 0
spl-token create-account ${MINT2_ADDRESS}
spl-token mint ${MINT2_ADDRESS} 30000

spl-token create-token ${SCRIPT_PATH}/sample_accounts/prize-mint2-keypair.json --decimals 2
spl-token create-account ${MINT3_ADDRESS}
spl-token mint ${MINT3_ADDRESS} 30000

solana airdrop 10000
solana transfer --allow-unfunded-recipient ${TEST_USER_ADDRESS} 0.1
solana transfer --allow-unfunded-recipient ${MINT1_FAUCET_ADDRESS} 100

spl-token transfer --allow-unfunded-recipient --fund-recipient  ${MINT1_ADDRESS} 3 ${TEST_USER_ADDRESS}
spl-token transfer --allow-unfunded-recipient --fund-recipient  ${MINT1_ADDRESS} 50 ${MINT1_FAUCET_ADDRESS}
echo "Done"

echo "Creating sample raffles..."
cd ${ROOT_PATH}
cargo build
${SCRIPT_PATH}/../target/debug/draffle create-raffle ${MINT1_ADDRESS} 500000 "$(date --utc -d "+2 minute" '+%Y-%m-%d %H:%M')" "${SCRIPT_PATH}/sample_accounts/raffle/entrants1-keypair.json" # AopPMW9k4Q5K8bw9Vf8KEqk5wJNrkvkBWDCKzq1eDUBr
${SCRIPT_PATH}/../target/debug/draffle add-prize AopPMW9k4Q5K8bw9Vf8KEqk5wJNrkvkBWDCKzq1eDUBr ${MINT2_ADDRESS} 25 0
${SCRIPT_PATH}/../target/debug/draffle add-prize AopPMW9k4Q5K8bw9Vf8KEqk5wJNrkvkBWDCKzq1eDUBr ${NFT1_ADDRESS} 1 1
${SCRIPT_PATH}/../target/debug/draffle add-prize AopPMW9k4Q5K8bw9Vf8KEqk5wJNrkvkBWDCKzq1eDUBr ${MINT3_ADDRESS} 334 2
${SCRIPT_PATH}/../target/debug/draffle add-prize AopPMW9k4Q5K8bw9Vf8KEqk5wJNrkvkBWDCKzq1eDUBr ${NFT4_ADDRESS} 1 3
${SCRIPT_PATH}/../target/debug/draffle add-prize AopPMW9k4Q5K8bw9Vf8KEqk5wJNrkvkBWDCKzq1eDUBr ${MINT3_ADDRESS} 12300 4
${SCRIPT_PATH}/../target/debug/draffle create-raffle ${MINT1_ADDRESS} 200000 "$(date --utc -d "-1 minute" '+%Y-%m-%d %H:%M')" "${SCRIPT_PATH}/sample_accounts/raffle/entrants2-keypair.json" # 4SM7QuwpV8zmtGEih1uxKnzm4W7E4VAcRdmKjZjmq8ah
${SCRIPT_PATH}/../target/debug/draffle create-raffle ${MINT1_ADDRESS} 1000000 "$(date --utc -d "+5 minute" '+%Y-%m-%d %H:%M')" "${SCRIPT_PATH}/sample_accounts/raffle/entrants3-keypair.json" # 3u7t4uGkMP1VW5obT78rgk74zdATTuNuy6BWPfRucLfj
${SCRIPT_PATH}/../target/debug/draffle add-prize 3u7t4uGkMP1VW5obT78rgk74zdATTuNuy6BWPfRucLfj ${MINT2_ADDRESS} 25 0
${SCRIPT_PATH}/../target/debug/draffle add-prize 3u7t4uGkMP1VW5obT78rgk74zdATTuNuy6BWPfRucLfj ${NFT2_ADDRESS} 1 1
${SCRIPT_PATH}/../target/debug/draffle add-prize 3u7t4uGkMP1VW5obT78rgk74zdATTuNuy6BWPfRucLfj ${MINT1_ADDRESS} 30100000 2
${SCRIPT_PATH}/../target/debug/draffle create-raffle ${WSOL} 200000000 "$(date --utc -d "+10 minute" '+%Y-%m-%d %H:%M')" "${SCRIPT_PATH}/sample_accounts/raffle/entrants4-keypair.json" # 2mrwjEz67DXTWKaVPjWwkwVPtGRWyKrTeyK5VzintsC5
${SCRIPT_PATH}/../target/debug/draffle add-prize 2mrwjEz67DXTWKaVPjWwkwVPtGRWyKrTeyK5VzintsC5 ${NFT5_ADDRESS} 1 0
${SCRIPT_PATH}/../target/debug/draffle create-raffle ${MINT1_ADDRESS} 200000 "$(date --utc -d "+1 day" '+%Y-%m-%d %H:%M')" "${SCRIPT_PATH}/sample_accounts/raffle/entrants5-keypair.json" # 9FoUjfUpWwhHYaGKM9G5eYab7qow3oWqdo2G5Ehj3h5L
${SCRIPT_PATH}/../target/debug/draffle add-prize 9FoUjfUpWwhHYaGKM9G5eYab7qow3oWqdo2G5Ehj3h5L ${MINT3_ADDRESS} 25 0
${SCRIPT_PATH}/../target/debug/draffle add-prize 9FoUjfUpWwhHYaGKM9G5eYab7qow3oWqdo2G5Ehj3h5L ${MINT2_ADDRESS} 88 1
${SCRIPT_PATH}/../target/debug/draffle add-prize 9FoUjfUpWwhHYaGKM9G5eYab7qow3oWqdo2G5Ehj3h5L ${NFT3_ADDRESS} 1 2
echo "Done"

echo "Creating sample NFT metadata with URLs REACT_APP_URL=${REACT_APP_URL} and REACT_APP_RPC_ENDPOINT=${REACT_APP_RPC_ENDPOINT}"
${SCRIPT_PATH}/metaplex-token-metadata-test-client create_metadata_accounts --name "Degen Ape #1" --symbol "DA" --uri "${REACT_APP_URL}/nfts/degenApe1.json" --url "${REACT_APP_RPC_ENDPOINT}" --mint "${SCRIPT_PATH}/sample_accounts/prize-nft1-keypair.json" --keypair ~/.config/solana/id.json
${SCRIPT_PATH}/metaplex-token-metadata-test-client create_metadata_accounts --name "Yolo #123" --symbol "YLO" --uri "${REACT_APP_URL}/nfts/nft-one.json" --url "${REACT_APP_RPC_ENDPOINT}" --mint "${SCRIPT_PATH}/sample_accounts/prize-nft2-keypair.json" --keypair ~/.config/solana/id.json
${SCRIPT_PATH}/metaplex-token-metadata-test-client create_metadata_accounts --name "Solpunk #4484" --symbol "SP" --uri "${REACT_APP_URL}/nfts/punk4484.json" --url "${REACT_APP_RPC_ENDPOINT}" --mint "${SCRIPT_PATH}/sample_accounts/prize-nft3-keypair.json" --keypair ~/.config/solana/id.json
${SCRIPT_PATH}/metaplex-token-metadata-test-client create_metadata_accounts --name "SMB #1" --symbol "SMB" --uri "${REACT_APP_URL}/nfts/smb1.json" --url "${REACT_APP_RPC_ENDPOINT}" --mint "${SCRIPT_PATH}/sample_accounts/prize-nft4-keypair.json" --keypair ~/.config/solana/id.json
${SCRIPT_PATH}/metaplex-token-metadata-test-client create_metadata_accounts --name "Solarian #1" --symbol "SLR" --uri "${REACT_APP_URL}/nfts/solarian1.json" --url "${REACT_APP_RPC_ENDPOINT}" --mint "${SCRIPT_PATH}/sample_accounts/prize-nft5-keypair.json" --keypair ~/.config/solana/id.json

fg 1