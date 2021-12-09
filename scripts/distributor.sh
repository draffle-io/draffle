# Distributes tt to a file with wallets on each line
# 0.1 SOL and 1 TT should do
SCRIPT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

DCT_MINT_ADDRESS=DCTo8EdRrycGpjRDntmdAMoaHdq77mQwdEchtoXAtje3
echo "${DCT_MINT_ADDRESS}"

while read p; do
  spl-token transfer --allow-unfunded-recipient --fund-recipient  ${DCT_MINT_ADDRESS} 1 $p --owner ../admin/keypairs/draffle-master-keypair.json --fee-payer ../admin/keypairs/draffle-master-keypair.json --url https://bold-falling-dream.solana-mainnet.quiknode.pro/40ffd401477e07ef089743fe2db6f9f463e1e726/
done < wallets.txt