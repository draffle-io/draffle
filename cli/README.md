# CLI to interact with the draffle program

All commands to be run from the project root after a `cargo build`

## Setup a raffle

Create a raffle, with proceeds mint, amount, end date, max-entrants and a specific wallet

`./target/debug/draffle create-raffle So11111111111111111111111111111111111111112 10000000 "$(date --utc -d "+96 hour" '+%Y-%m-%d %H:%M')" --max-entrants 690 --provider.cluster mainnet --provider.wallet ../admin/keypairs/operation-keypair.json --program-id dRafA7ymQiLKjR5dmmdZC9RPX4EQUjqYFB3mWokRuDs`

Raffle address: D45wu2y8EjetNwkCxVLqW3Rfk5oZWiuUvHhMavSjW3Uc
Cluster clock unix_timestamp: 1639052930, raffle end_timestamp: 1639398480

Add a prize to the raffle, 1 NFT of mint 7d3gKBqFeA4KpUwC6uYexK6LPTmzeUP7tHV1KEiFmZUa, add prize index 0

`./target/debug/draffle add-prize D45wu2y8EjetNwkCxVLqW3Rfk5oZWiuUvHhMavSjW3Uc 7d3gKBqFeA4KpUwC6uYexK6LPTmzeUP7tHV1KEiFmZUa 1 0 --provider.cluster mainnet --provider.wallet ../admin/keypairs/operation-keypair.json --program-id dRafA7ymQiLKjR5dmmdZC9RPX4EQUjqYFB3mWokRuDs`

## After the raffle end

Reveal winners, preferably event driven right at the end of the raffle

`./target/debug/draffle reveal-winners D45wu2y8EjetNwkCxVLqW3Rfk5oZWiuUvHhMavSjW3Uc --provider.cluster mainnet --provider.wallet ../admin/keypairs/operation-keypair.json --program-id dRafA7ymQiLKjR5dmmdZC9RPX4EQUjqYFB3mWokRuDs`

Collect proceeds of the raffle into token account 9u6RBuTGr4WGEVoFVcZtMW82nWKJrrDh5UNkBhFRq5Sr owned by operation-keypair.json

`./target/debug/draffle collect-proceeds D45wu2y8EjetNwkCxVLqW3Rfk5oZWiuUvHhMavSjW3Uc 9u6RBuTGr4WGEVoFVcZtMW82nWKJrrDh5UNkBhFRq5Sr --provider.cluster mainnet --provider.wallet ../admin/keypairs/operation-keypair.json --program-id dRafA7ymQiLKjR5dmmdZC9RPX4EQUjqYFB3mWokRuDs`