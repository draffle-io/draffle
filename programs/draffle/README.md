# dRaffle program

The goal of the program is to provide permissionless raffles.

An arbitrary number of prizes can be placed in each raffle, the end time, max entrants, the proceeds mint and ticket price are defined at creation.

Once the raffle ends time is reached, a permissionless call fixes the current blockhash as the randomness seed

Then each prize can be claimed by the public key matching the winning ticket index. The winning ticket index for each prize is obtained deriving the randomness using the prize index, hashed then modulo the total of entrants.

https://docs.chain.link/docs/chainlink-vrf-best-practices/#getting-multiple-random-number