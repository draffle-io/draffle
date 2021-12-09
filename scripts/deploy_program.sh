set -e

SCRIPT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

echo "Deploying program..."
solana program deploy --program-id ${SCRIPT_PATH}/sample_accounts/draffle-keypair.json target/deploy/draffle.so
echo "Done"
