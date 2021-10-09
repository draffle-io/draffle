# Community staking

The goal of this staking program is not to be mathematically or economically sound, but rather to be fun and interactive.

To reward early adopters and encourage interaction with the dApp, community staking allows users to yield at a fixed rate and when the reward period ends, rewards stop.
Staker can at any time compound rewards or unstake to get back his tokens.

- Registry: Defines a token vault, an admin, rewards period and yield
- Controller: controls the reward multiplier of users, within certain limits, this is to allow active users to receive a boost if they contribute to the community. Controllers are for a registry and are assigned and revoked by the admin.
- Staker: The entity that stakes the token
- Stake account: The state holding the staking variables
